import { LightningElement, track, wire, api} from 'lwc';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFIELD from '@salesforce/schema/User.Name';
import USER_SMALL_PHOTOURLFIELD from '@salesforce/schema/User.SmallPhotoUrl';
import Resource from '@salesforce/resourceUrl/ChecklistGeniusDuc';
import { loadStyle } from 'lightning/platformResourceLoader';
//import customCSS from '@salesforce/resourceUrl/customChecklistCSS';

export default class MyChecklistsPageMobCD extends LightningElement {
    selectedNav = 'default_recent';
     @track iconName = 'utility:rows';
      @api dynamicHeight;

      togglePanel() {
        
          this.iconName = this.iconName === 'utility:rows' ? 'utility:close' : 'utility:rows';
          let leftPanel = this.template.querySelector('div[data-my-id=leftPanel]');
          let rightPanel = this.template.querySelector('div[data-my-id=rightPanel]');

          if (leftPanel.classList.contains('slds-is-open')) {
              leftPanel.classList.remove('slds-is-open');
              leftPanel.classList.remove('open-panel');
              leftPanel.classList.add('slds-is-closed');
              leftPanel.classList.add('close-panel');
              rightPanel.classList.add('expand-panel');
              rightPanel.classList.remove('collapse-panel');
          } else {
              leftPanel.classList.add('slds-is-open');
              leftPanel.classList.add('open-panel');
              leftPanel.classList.remove('slds-is-closed');
              leftPanel.classList.remove('close-panel');
              rightPanel.classList.remove('expand-panel');
              rightPanel.classList.add('collapse-panel');
          }
          console.log('to check windows ::');
          const checklistDiv = this.template.querySelector('.my-checklist');
          if (checklistDiv) {
              checklistDiv.scrollTop = 0;
          }
      }

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
    icon4 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#date_time';
    icon5 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#date_input';
    icon6 = Resource+'/style/icons/standard-sprite/svg/symbols.svg#task2';

    @wire(getRecord, { recordId: Id, fields: [UserNameFIELD, USER_SMALL_PHOTOURLFIELD]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.userPhoto = data.fields.SmallPhotoUrl.value;
            console.log('userPhoto:', this.userPhoto);
            this.currentUserName = data.fields.Name.value.split(' ')[0];
            console.log('User details:', this.currentUserName);
            if(this.currentUserName.toLowerCase().endsWith('s')){
                this.mychecklist = this.currentUserName + '\' Checklists';
            }else{
                this.mychecklist = this.currentUserName + '\'s Checklists';
            }
            
        } else if (error) {
            this.error = error ;
        }
    }

    connectedCallback(){
        console.log(' window.innerHeight in connected callback:: ' +window.innerHeight);
        this.loadCss();
        this.calculateHeight();
    }

    calculateHeight() {
        console.log(' window.innerHeight :: ' +window.innerHeight);
        const divElement = this.template.querySelector('.empty-state-vrtl');
        if (divElement) {
            const contentHeight = divElement.scrollHeight;
            console.log('contentHeight :: ' +contentHeight);
        }
        this.dynamicHeight = 'border: none; flex: 0 1 auto; padding-right: -5px; background-color: white; height: '+window.innerHeight+'px;';
    }

    renderedCallback(){
        this.loadCss();
    }

    loadCss(){
        Promise.all([
            // loadStyle( this, this.customStyle )            
            loadStyle( this, this.customCSS )            
        ]).then(() => {
            console.log( 'Css File loaded' );
        })
            .catch(error => {
                console.log( error.body.message );
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

    handleSelect (event) {
        console.log('onclick inside handleSelect.');
        console.log('event.currentTarget.dataset.name:',event.currentTarget.dataset.name);

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
        this.calculateHeight();
        this.togglePanel();
    }

    filterCounts;
    todayCount;
    overdueCount;
    next7DaysCount;
    next14DaysCount;
    next30DaysCount;
    completedCount;
    
    handleFilterCountsChange(event) {
        console.log('Inside handleFilterCountsChange');

        // Retrieve the filterCounts Obj from the event detail
        const filterCountsObj = event.detail.filterCounts;
        console.log('Inside handleFilterCountsChange filterCountsObj:',filterCountsObj);
        console.log('Inside handleFilterCountsChange filterCountsObj[\'overdue\']:',filterCountsObj.overdue);

        ({
            today: this.todayCount,
            overdue: this.overdueCount,
            next_7_days: this.next7DaysCount,
            next_14_days: this.next14DaysCount,
            next_30_days: this.next30DaysCount,
            completed: this.completedCount
        } = filterCountsObj);

        console.log('After destructuring the filterCountsObj object', this.todayCount, this.overdueCount,);

        // Retrieve the filterCounts map from filterCountsObj
        this.filterCounts = new Map(Object.entries(filterCountsObj));
        console.log('Inside handleFilterCountsChange this.filterCounts:',this.filterCounts);
    }

    /*
    getTabClass(tabName) {
        // Return the appropriate class based on the selected state
        return `slds-vertical-tabs__nav-item slds-var-m-bottom_small ${this.newTab[tabName] ? 'slds-is-active' : ''}`;
    } */

    
}