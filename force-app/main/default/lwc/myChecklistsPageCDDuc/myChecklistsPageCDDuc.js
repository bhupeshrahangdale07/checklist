import { LightningElement, track, wire } from 'lwc';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFIELD from '@salesforce/schema/User.Name';
import USER_SMALL_PHOTOURLFIELD from '@salesforce/schema/User.SmallPhotoUrl';
import Resource from '@salesforce/resourceUrl/ChecklistGeniusDuc';
import { loadStyle } from 'lightning/platformResourceLoader';
//import customCSS from '@salesforce/resourceUrl/customChecklistCSS';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MyChecklistsPage extends LightningElement {
    @track filter = 'today';
    mychecklist = '';
    @track error;
    @track userId = Id;
    @track currentUserName;
    @track userPhoto;
    
    customCSS = Resource + '/css/style.css';

    icon1 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#action_list_component';
    icon2 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#business_hours';
    icon3 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#date_input';
    icon4 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#event';
    icon5 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#date_time'; //shift_pattern
    icon6 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#picklist_type';
    icon7 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#task2';

    /*
	 * This method is used to fetch the details of the User who's using the My Checklist page currently.
     * It fetches the user photo and user name and assigns it to the variables after processing for where to show apostrophe properly.
	*/
    @wire(getRecord, { recordId: Id, fields: [UserNameFIELD, USER_SMALL_PHOTOURLFIELD]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.userPhoto = data.fields.SmallPhotoUrl.value;
            //console.log('userPhoto:', this.userPhoto);
            this.currentUserName = data.fields.Name.value.split(' ')[0];
            //console.log('User details:', this.currentUserName);
            if(this.currentUserName.toLowerCase().endsWith('s')){
                this.mychecklist = this.currentUserName + '\' Checklists Duc';
            }else{
                this.mychecklist = this.currentUserName + '\'s Checklists Duc';
            }
            
        } else if (error) {
            this.error = error;
            this.handleShowToast('Error fetching user details', error?.body?.message, 'error', '');
        }
    }

    connectedCallback(){
        this.loadCss();
    }

    renderedCallback(){
        this.loadCss();
    }

    loadCss(){
        Promise.all([
            // loadStyle( this, this.customStyle )            
            loadStyle( this, this.customCSS )            
        ]).then(() => {
            //console.log( 'Css File loaded' );
        }).catch(error => {
            //console.log( error.body.message );
        });
    }

    @track newTab = {
        'today': true,
        'overdue': false,
        'next_7_days': false,
        'next_14_days': false,
        'next_30_days': false,
        'all_open': false,
        'completed': false,
    };

    /*
	 * On click of any category on My Checklist page such as Today's Checklists, Overdue, etc.. this method checks for which category is clicked and assigns suitable values to the 'newTab' and 'filter' variables.
	*/
    handleSelect (event) {
        //console.log('Onclick inside handleSelect. event.currentTarget.dataset.name:',event.currentTarget.dataset.name);

        const tabs = this.template.querySelectorAll('.slds-vertical-tabs__nav-item');
        // Remove the 'slds-is-active' class from all tabs
        tabs.forEach(tab => tab.classList.remove('slds-is-active'));
        // Add the 'slds-is-active' class to the clicked tab
        event.currentTarget.classList.add('slds-is-active');

        /*const tabName = event.currentTarget.dataset.name;
        // Update the selected state
        this.newTab = {
            today: tabName === 'today',
            overdue: tabName === 'overdue',
            next_7_days: tabName === 'next_7_days',
            next_14_days: tabName === 'next_14_days',
            next_30_days: tabName === 'next_30_days',
            completed: tabName === 'completed',
        };*/

        if (event.currentTarget.dataset.name === 'today') {
            this.newTab = {};
            this.newTab.today = true;
            this.filter = 'today';
        } else if (event.currentTarget.dataset.name === 'overdue') {
            this.newTab = {};
            this.newTab.overdue = true;
            this.newTab.today = false;
            this.filter = 'overdue';
        } else if (event.currentTarget.dataset.name === 'next_7_days') {
            this.newTab = {};
            this.newTab.next_7_days = true;
            this.newTab.today = false;
            this.filter = 'next_7_days';
        } else if (event.currentTarget.dataset.name === 'next_14_days') {
            this.newTab = {};
            this.newTab.next_14_days = true;
            this.newTab.today = false;
            this.filter = 'next_14_days';
        } else if (event.currentTarget.dataset.name === 'next_30_days') {
            this.newTab = {};
            this.newTab.next_30_days = true;
            this.newTab.today = false;
            this.filter = 'next_30_days';
        } else if (event.currentTarget.dataset.name === 'all_open') {
            this.newTab = {};
            this.newTab.all_open = true;
            this.newTab.today = false;
            this.filter = 'all_open';
        } else if (event.currentTarget.dataset.name === 'completed') {
            this.newTab = {};
            this.newTab.completed = true;
            this.newTab.today = false;
            this.filter = 'completed';
        }
    }

    filterCounts;
    todayCount;
    overdueCount;
    next7DaysCount;
    next14DaysCount;
    next30DaysCount;
    completedCount;

    /*
	 * This method is called onfiltercountschange event. It happens everytime a category(filter) is clicked on My Checklist page.
     * It receives the filter counts from navItemCmp and assigns it to the local variables.
	*/
    handleFilterCountsChange(event) {

        // Retrieve the filterCounts Obj from the event detail
        const filterCountsObj = event.detail.filterCounts;
        //console.log('handleFilterCountsChange, filterCountsObj:',filterCountsObj);
        //console.log('handleFilterCountsChange, filterCountsObj[\'overdue\']:',filterCountsObj.overdue);

        ({
            today: this.todayCount,
            overdue: this.overdueCount,
            next_7_days: this.next7DaysCount,
            next_14_days: this.next14DaysCount,
            next_30_days: this.next30DaysCount,
            completed: this.completedCount
        } = filterCountsObj);

        //console.log('After destructuring the filterCountsObj object', this.todayCount, this.overdueCount,);

        // Retrieve the filterCounts map from filterCountsObj
        this.filterCounts = new Map(Object.entries(filterCountsObj));
        //console.log('handleFilterCountsChange, this.filterCounts:',this.filterCounts);
    }

    /*
    getTabClass(tabName) {
        // Return the appropriate class based on the selected state
        return `slds-vertical-tabs__nav-item slds-var-m-bottom_small ${this.newTab[tabName] ? 'slds-is-active' : ''}`;
    } */

    /*
     * Generic method to show toast message on UI. Can be called from multiple places.
    */
    handleShowToast(title, message, variant, mode) {

        // Create and dispatch the event
        const event = new ShowToastEvent({
            title: title && title !== '' ? title : 'Success' ,
            message: message && message !== '' ? message :'This is a success toast message!',
            variant: variant && variant !== '' ? variant :'success',
            mode: mode && mode !== '' ? mode :'dismissable'
        });
        this.dispatchEvent(event); // Display the toast

    }
}