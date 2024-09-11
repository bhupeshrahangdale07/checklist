import { LightningElement, track, wire, api } from 'lwc';
import fetchCheckLists from '@salesforce/apex/MyChecklistsPageManager.fetchCheckLists';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getRelationObjectIconFieldMap from '@salesforce/apex/MyChecklistsPageManager.getRelationObjectIconFieldMap';

import { getRecord } from 'lightning/uiRecordApi';
import uId from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import CHECKLIST_ITEM_OBJECT from '@salesforce/schema/Checklist_Item__c';
import CHECK_POINT_FIELD from '@salesforce/schema/Checklist_Item__c.Item__c';
import CHECK_POINT_ORDER_FIELD from '@salesforce/schema/Checklist_Item__c.Item_Order__c';
import CHECKLIST_FIELD from '@salesforce/schema/Checklist_Item__c.Checklist__c';
import LOCALE from '@salesforce/i18n/locale';

import UserNameFIELD from '@salesforce/schema/User.Name';
import userAliasFIELD from '@salesforce/schema/User.Alias';
import Resource from '@salesforce/resourceUrl/ChecklistGeniusDuc';


export default class NavItemCmp extends LightningElement {
    objectApiName = CHECKLIST_ITEM_OBJECT;
    checkPointField = CHECK_POINT_FIELD;
    checkPointOrderField = CHECK_POINT_ORDER_FIELD;
    checklistField = CHECKLIST_FIELD;
    noCLIcon = Resource + '/style/icons/action/Empty-state.svg';

    @api filter;
    
    @track filteredCheckList = [];
    @track groupedCheckLists = {};
    @track groupCheckKeys = [];
    @track groupedCheckListsMap = new Map();
    //@track groupedCheckListsArray = [];
    //@api userId;
    @track triggeredCheckList;
    @track ActiveAccordionCheckList;
    @track CreateItemRecord = false;
    @track CheckList;
    @track Due_Days = 0;
    @track filterCounts;
    userLocale = LOCALE;

    @track error;
    @track userId = uId;
    @track currentUserName;
    @track currentUserAlias;
    domain;
    @track sObjApiName;
    //@track sObjIcon = "standard:account";
    
    relationFieldIconMap;

    @track row;
    @track isDragged = false;

    @track ActivatedAddItem = false;
    @track checkboxSpinner = false;

    @track isDivVisible = true;
    @track isDesktop = false;
    @track isMobile = false;

    @wire(getRecord, { recordId: uId, fields: [UserNameFIELD, userAliasFIELD ]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.currentUserName = data.fields.Name.value;
            this.currentUserAlias = data.fields.Alias.value;
            //console.log('User details:', this.currentUserName, this.currentUserAlias);
        } else if (error) {
            this.error = error ;
            this.handleShowToast('Error fetching user details', error?.body?.message, 'error', '');
        }
    }

    /*
     * This method fetches Icon Map for different objects. Assigns it to a variable relationFieldIconMap, which will then be used in grouped checklists array variable in another method.
    */
    @wire(getRelationObjectIconFieldMap, { objectApiName: 'kt_checklist__Checklist__c'})
    iconInfo({error, data}) {
        if (data) {
            //console.log('data:',data);
            this.relationFieldIconMap = data;
            
            // Call the method to indicate that data is ready
            this.handleIconInfoData();
        } else if (error) {
            this.error = error ;
            this.handleShowToast('Error fetching Icon Map', error?.body?.message, 'error', '');
        }
    }
    
    connectedCallback() {
        // Get the current URL
        const currentURL = window.location.href;
        // Extract the domain from the URL
        const url = new URL(currentURL);
        this.domain = url.hostname;
        //console.log('filter:', this.filter);
        //console.log('domain:', this.domain);

        // Fetch records only if the iconInfo wire is ready
        if(this.relationFieldIconMap) {
            //alert('Inside Nav cmp');
            this.fetchRecords();
        }
        if(FORM_FACTOR === 'Large'){
            this.isDesktop =true;
            //console.log('this.isDesktop :: ' +this.isDesktop);
        }
        if(FORM_FACTOR === 'Small'){
            this.isDesktop =true; // Remove this line, and uncomment the following when Mobile designs are continued development
            // this.isMobile =true;
            // console.log('this.isMobile :: ' +this.isMobile);
        }

    }

    /*
     * This method calls 'fetchRecords' method based on whether the Icon Map is fetched.
    */
    handleIconInfoData() {
        if (this.relationFieldIconMap) {
            this.fetchRecords();
        }
    }

    renderedCallback() {
        //this.fetchRecords();
        
        // const style = document.createElement('style');
        // style.innerText = `c-sample .slds-text-heading_small {
        //     color: blue;
        // }
        // .buttonClass button {
        //     width : 100%;
        //     text-align:left;
        // }
        // .buttonClass button span {
        //     width: 100%;
        // }
        
        // .slds-button_stretch button{
        //     width : 100%;
        //     text-align:left;
        //     border-radius: 1px;
        // }
        // `;
        // this.template.querySelector('lightning-button-stateful')?.appendChild(style);
    }

    /*
     * This method fetches and procesess all the checklists of the current user.
     * It handles the filter counts, creates url for grouping on mycheclist page, filters the checklist for the selected category, sends the filter counts to its parent component via event.
    */
    async fetchRecords() {
        var options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        await fetchCheckLists({ userId: this.userId })
            .then((result) => {
                this.CheckList = result;
                this.filteredCheckList = [];
                this.groupedCheckListsMap = new Map();
               

                this.filterCounts = new Map([
                    ['today', 0],
                    ['overdue', 0],
                    ['next_7_days', 0],
                    ['next_14_days', 0],
                    ['next_30_days', 0],
                    ['completed', 0],
                ]);


                if(this.CheckList.length > 0){
                    //this.mapAccordions();
                    this.CheckList.forEach(item => {
                        //console.log('item:', item);
                        //console.log('item.kt_checklist__Checklist_Title__c:', item.kt_checklist__Checklist_Title__c);
                        item.ProgressbarPercentage = 'width:'+item.kt_checklist__Percentage_Completion__c+'%';
                        let parentField;
                        for (let prop in item) {
                            if (item[prop] instanceof Object && item[prop] !== null && prop !== 'kt_checklist__Checklist_Items__r') {
                                parentField = prop;
                            }
                        }
                        //console.log('parentField:', parentField);

                        if(parentField){
                            item.displayUrl = item[parentField].Name; //item[parentSObjField]
                            item.parentId = item[parentField].Id;
                            //console.log('item.displayUrl:', item.displayUrl);

                            parentField = parentField.replace('__r', '__c');

                            item.fullUrl = 'https://' + this.domain + '/' + item[parentField];
                            //console.log('fullUrl:', item.fullUrl);
                            item.sObjApiName = parentField;
                            
                            //Due date, Progress ring, Filtering based on due date
                            item.progressRingVariant = 'base-autocomplete';
                            item.dueColour = '';
                            let crDate = new Date(item.CreatedDate);
                            let dueDate = new Date(crDate);

                            if(item.kt_checklist__Due_Days__c != null){
                                dueDate.setDate(crDate.getDate() + item.kt_checklist__Due_Days__c);
                                
                                //console.log('dueDate Bfr:', dueDate);
                                item.finalDueDate = dueDate.toLocaleDateString(this.userLocale, options);
                                //console.log('dueDate Aftr:', dueDate);

                                // const today = new Date();
                                // const todayNoHours = today.setHours(0, 0, 0, 0);
                                // const dueDateNoHours = dueDate.setHours(0, 0, 0, 0);
                                // if (dueDateNoHours < todayNoHours && item.kt_checklist__Percentage_Completion__c < 100) {
                                //     item.progressRingVariant = 'expired';
                                //     item.dueColour = 'due-red';
                                // } else if (dueDateNoHours === todayNoHours && item.kt_checklist__Percentage_Completion__c < 100) {
                                //     item.progressRingVariant = 'warning';
                                //     item.dueColour = 'due-orange';
                                // } else {
                                //     item.progressRingVariant = 'base-autocomplete';
                                //     item.dueColour = 'due-green';
                                // }


                                let currentDate = new Date();
                                let currentDateNoHours = new Date(currentDate.setHours(0, 0, 0, 0));
                                const dueDateNoHours2 = new Date(dueDate.setHours(0, 0, 0, 0));
                                //console.log('currentDateNoHours.getTime():',currentDateNoHours.getTime());

                                // Calculate filter values based on due date and completion percentage
                                if (item.kt_checklist__Percentage_Completion__c < 100) {
                                    if (dueDateNoHours2.getTime() === currentDateNoHours.getTime()) {
                                        this.filterCounts.set('today', this.filterCounts.get('today') + 1);
                                    } else if (dueDateNoHours2 < currentDateNoHours) {
                                        this.filterCounts.set('overdue', this.filterCounts.get('overdue') + 1);
                                    } else if (dueDateNoHours2 > currentDateNoHours) {
                                        if (dueDateNoHours2 > new Date(currentDateNoHours.getTime() + 14 * 24 * 60 * 60 * 1000) && dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 30 * 24 * 60 * 60 * 1000)) {
                                            this.filterCounts.set('next_30_days', this.filterCounts.get('next_30_days') + 1);
                                        }else if(dueDateNoHours2 > new Date(currentDateNoHours.getTime() + 7 * 24 * 60 * 60 * 1000) && dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 14 * 24 * 60 * 60 * 1000)){
                                            this.filterCounts.set('next_30_days', this.filterCounts.get('next_30_days') + 1);
                                            this.filterCounts.set('next_14_days', this.filterCounts.get('next_14_days') + 1);
                                        }else if(dueDateNoHours2 > new Date(currentDateNoHours.getTime()) && dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                                            this.filterCounts.set('next_30_days', this.filterCounts.get('next_30_days') + 1);
                                            this.filterCounts.set('next_14_days', this.filterCounts.get('next_14_days') + 1);
                                            this.filterCounts.set('next_7_days', this.filterCounts.get('next_7_days') + 1);
                                        }

                                        /*
                                        if (dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                                            this.filterCounts.set("next_7_days", this.filterCounts.get("next_7_days") + 1);

                                        } else if (dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 14 * 24 * 60 * 60 * 1000)) {
                                            this.filterCounts.set("next_14_days", this.filterCounts.get("next_14_days") + 1);
                                        } else if (dueDateNoHours2 <= new Date(currentDateNoHours.getTime() + 30 * 24 * 60 * 60 * 1000)) {
                                            this.filterCounts.set("next_30_days", this.filterCounts.get("next_30_days") + 1);
                                        }*/
                                    }
                                } else {
                                    this.filterCounts.set('completed', this.filterCounts.get('completed') + 1);
                                }
                                //console.log('filterCounts Aftr:', this.filterCounts);

                                //Filter the checklists
                                if(item.kt_checklist__Percentage_Completion__c < 100){
                                    if(this.filter === 'today' && dueDateNoHours2.getTime() === currentDateNoHours.getTime()){
                                        //console.log('Inside IF today');
                                        this.filteredCheckList.push(item);
                                    }else if(this.filter === 'overdue' && dueDateNoHours2 < currentDateNoHours){
                                        //console.log('Inside IF overdue');
                                        this.filteredCheckList.push(item);
                                    }else if(this.filter === 'next_7_days' && dueDateNoHours2 > currentDateNoHours){
                                        currentDateNoHours.setDate(currentDateNoHours.getDate() + 7);
                                        if(dueDateNoHours2 <= currentDateNoHours){
                                            //console.log('Inside IF next_7_days');
                                            this.filteredCheckList.push(item);
                                        }
                                    }else if(this.filter === 'next_14_days' && dueDateNoHours2 > currentDateNoHours){
                                        currentDateNoHours.setDate(currentDateNoHours.getDate() + 14);
                                        if(dueDateNoHours2 <= currentDateNoHours){
                                            //console.log('Inside IF next_14_days');
                                            this.filteredCheckList.push(item);
                                        }
                                    }else if(this.filter === 'next_30_days' && dueDateNoHours2 > currentDateNoHours){
                                        currentDateNoHours.setDate(currentDateNoHours.getDate() + 30);
                                        if(dueDateNoHours2 <= currentDateNoHours){
                                            //console.log('Inside IF next_30_days');
                                            this.filteredCheckList.push(item);
                                        }
                                    }else if(this.filter === 'all_open'){
                                        //console.log('Inside IF all_open');
                                        this.filteredCheckList.push(item);
                                    }
                                }else if(this.filter === 'completed'){
                                    //console.log('Inside IF completed');
                                    this.filteredCheckList.push(item);
                                }
                                // console.log("Before Objectifying", Object.keys(this.groupedCheckLists));
                                
                                //this.groupedCheckLists = Object.keys(this.groupedCheckLists).map(key => ({ fullUrl: key, items: this.groupedCheckLists[key] }));
                                //console.log('After Objectifying');
                            }
                        }
                    });
                    //console.log('--- Loop ended ---');
                    // console.log("this.filteredCheckList:",this.filteredCheckList);
                    // console.log("this.filteredCheckList.length:",this.filteredCheckList.length);
                    //console.log(' ');

                    let setObjNames = new Set();
                    this.filteredCheckList.forEach(fCL => {
                        if (!this.groupedCheckListsMap.has(fCL.displayUrl)) {
                            this.groupedCheckListsMap.set(fCL.displayUrl, []);
                        }
                        this.groupedCheckListsMap.get(fCL.displayUrl).push(fCL);
                        //apex call needed for Icon name?
                        setObjNames.add(fCL.sObjApiName);
                    });
                    //console.log('this.groupedCheckListsMap:',this.groupedCheckListsMap);
                    //console.log('setObjNames:', setObjNames);
                    
                    
                    //console.log('befr dispatch event..this.filterCounts:', this.filterCounts);
                    const filterCountsObj = Object.fromEntries(this.filterCounts.entries());
                    this.dispatchEvent(new CustomEvent('filtercountschange', {
                        detail: { filterCounts: filterCountsObj }
                    }));
                    //console.log('after dispatch event..');

                }else{
                    this.CheckList = undefined;
                }
            }).catch((err) => {
                //console.log('**err:',err);
                this.handleShowToast('Error', err?.body?.message, 'error', '');
                //alert('error '+err);
            });
    }

    /*
     * Helper method to convert Map to Array of Objects. Also, calls the sorting method before returning the array.
    */
    get groupedCheckListsMapArray() {
        let groupedCheckListsArray = [];
        //this.groupedCheckListsArray = [];
        for (let [key, value] of this.groupedCheckListsMap) {
            let firstRecordFullUrl = Array.isArray(value) && value.length > 0 ? value[0].fullUrl : '#';
            let parentId = Array.isArray(value) && value.length > 0 ? value[0].parentId : '';
            let firstRecordRelName = Array.isArray(value) && value.length > 0 ? value[0].sObjApiName : '#';
            //console.log('firstRecordRelName:',firstRecordRelName);
            //console.log(this.relationFieldIconMap);
            //console.log(this.relationFieldIconMap[firstRecordRelName]);

            let firstRecordIcon = this.relationFieldIconMap[firstRecordRelName];
            
            //console.log('firstRecordIcon:',firstRecordIcon);

            groupedCheckListsArray.push({ dUrl: key, parentId : parentId, firstRecordFullUrl: firstRecordFullUrl, firstRecordIcon:firstRecordIcon, records: value });
            //groupedCheckListsArray.push({ dUrl: key, firstRecordFullUrl: firstRecordFullUrl, records: value });
        }

        return this.sortGrouppedData(groupedCheckListsArray);
    }

    /*
     * Sorts the array that holds the filtered and grouped checklists in alphabatical order of the parent records.
    */
    sortGrouppedData(groupedCheckListsArray){
        
        groupedCheckListsArray.sort(function (a, b) {        
            let parentAStart = a.parentId.substring(0, 3);
            let parentBStart = b.parentId.substring(0, 3);

            // Compare 
            return parentAStart.localeCompare(parentBStart);
        });
        return groupedCheckListsArray;
    }

    get hasData() {
        //this.groupedCheckListsArray = [];
        return this.groupedCheckListsMapArray.length > 0;
    }


    // mapAccordions(){
    //     var dt = [...this.CheckList];
    //     var aac = [];
    //     dt.forEach(item => {
    //         aac.push(item.Id);

    //         // if(item.Checklist_Items__r){
    //         //     item.Checklist_Items__r.forEach(each => {
    //         //         if(each.Checked__c){
    //         //             each.iconName = 'utility:check';
    //         //             each.variant = 'brand';
    //         //         }else{
    //         //             each.iconName = 'utility:add';
    //         //             each.variant = 'neutral';
    //         //         }
    //         //     });
    //         // }

    //     });

    //     if(!this.ActiveAccordionCheckList){
    //         this.ActiveAccordionCheckList = [];
    //         this.ActiveAccordionCheckList = [...aac];
    //         //this.CheckList = [...dt];
    //     }        
    // }

    /*
     * Function to toggle visibility when collapse icon is clicked in grouping level
    */
    toggleVisibility(event) {
        const index = event.target.dataset.index;
        //console.log('Inside toggleVisibility, index:', index);
        const iconElements = this.template.querySelectorAll('.chevron-icon');
        iconElements.forEach((iconElement, i) => {
            if (i === parseInt(index, 10)) {
                iconElement.iconName = (iconElement.iconName === 'utility:chevronright')? 'utility:chevrondown' : 'utility:chevronright';
            }
        });

        const divs = this.template.querySelectorAll('.collapse-divs');
        //console.log('Inside toggleVisibility, divs:', divs);
        divs.forEach((div, i) => {
            //console.log('Inside toggleVisibility If(div), div:', div);
            if (i === parseInt(index, 10)) {
                //div.classList.toggle('visible');
                //div.classList.toggle('hidden');
                div.classList.toggle('active');
            }
        });
    }
    
    handlecompletedchecklist(){
        this.fetchRecords();
    }

    handleRemoveChecklist(){
        this.fetchRecords();
    }

    handleuncompletedchecklist(){
        this.fetchRecords();
    }
    
    /*
     * Generic method to show toast message on UI. Can be called from multiple places.
    */
    handleShowToast(title, message, variant, mode) {
        // const activeInputElement = this.template.activeElement;
        // const isInputFocused = this.template.activeElement.tagName.toLowerCase() === 'lightning-input';
        
        // Create and dispatch the event
        const event = new ShowToastEvent({
            title: title && title !== '' ? title : 'Success' ,
            message: message && message !== '' ? message :'This is a success toast message!',
            variant: variant && variant !== '' ? variant :'success',
            mode: mode && mode !== '' ? mode :'dismissable'
        });
        this.dispatchEvent(event); // Display the toast

        // if (isInputFocused) {
        //     setTimeout(() => {
        //         activeInputElement.focus();
        //     }, 15);
        // }
    }
}