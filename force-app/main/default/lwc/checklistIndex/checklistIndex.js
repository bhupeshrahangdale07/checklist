import { LightningElement, track, api, wire } from 'lwc';
// import ToastContainer from 'lightning/toastContainer';

import getRelatedFieldNameByRecordId from '@salesforce/apex/CheckListManager.getRelatedFieldNameByRecordId';
import getAssignedPermissions from '@salesforce/apex/CheckListManager.assignedPermissions';

import fetchCheckLists from '@salesforce/apex/CheckListManager.fetchCheckLists';

import loggedInUserId from '@salesforce/user/Id';

 import FORM_FACTOR from "@salesforce/client/formFactor";
import { loadStyle } from 'lightning/platformResourceLoader';
// import customCSS from '@salesforce/resourceUrl/customChecklistCSS';

import Resource from '@salesforce/resourceUrl/ChecklistGenius';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import DUEDATE_FIELD from '@salesforce/schema/Checklist__c.Due_Date__c';
// import PERCENTAGE_COMPLETION_FIELD from '@salesforce/schema/Checklist__c.Percentage_Completion__c';
import CHECKLIST_TITLE_FIELD from '@salesforce/schema/Checklist__c.Checklist_Title__c';

export default class ChecklistIndex extends NavigationMixin(LightningElement) {
  @api flexipageRegionWidth;
	@api readOnlyMode;
	@api ShowDetails;

	customCSS = Resource + '/css/style.css';
  

  icon1 =
  	Resource +
    '/style/icons/utility-sprite/svg/symbols.svg#edit_form';
  icon2 =
  	Resource +
    '/style/icons/utility-sprite/svg/symbols.svg#add';

	noCLIcon = Resource + '/style/icons/action/Empty-state.svg';

  checklistTitle_Field = CHECKLIST_TITLE_FIELD;
  // label = {Checklist_Relation_Validation};

  @api recordId;
  @track CheckList;
//   @track _CheckList;

	isAccessibleActions = false;
  @track openCreateChecklistDialog = false;
  @track openCreateChecklist = false;
  @track showCreateChecklistFooter = true;
  @track openCreateChecklistType = 'With Template';
  @track isDesktop = false;
  // Commented the mobile view  
  @track 
  isMobile = false;
  // Commented the mobile view  
  @track 
  isMobile1 = false;

  @track checklistLookupField;
  @track showCreateChecklist = false;
  @track showInstructions = false;
  @track checklistBtnStyle;
	@track isLoadingChecklistDetails = false;

	@track hasAdminStandardPermission = false;
	@track hasAdminPermission = false;

  get isNotMobile() {
    return !this.isMobile;
  }

	get enableEditMode() {
		return this.readOnlyMode == undefined ? true : !this.readOnlyMode;
	}

	@track openFiltersList = false;
	handleOpenFiltersList() {
		this.openFiltersList = !this.openFiltersList;
	}

	@track selectedFilter = '';
	filterOptions = [{ label: "-None-", name: "", value: '' },
	{ label: "Today's", name: "Today's", value: 'Today' },
	{ label: 'Open', name: 'Open', value: 'Open' },
	{ label: 'Overdues', name: 'Overdues', value: 'Overdues' },
	{ label: 'Completed', name: 'Completed', value: 'Completed' },
	{ label: "My Checklists", name: "My Checklists", value: 'My_Checklist' },
					];
	
	get showSelectedFilters() {
		return this.selectedFilters && this.selectedFilters.length > 0;
	}

	@track selectedFilters = [];
	handleFilterChange(event) {
		this.selectedFilter = event.detail.value;
		this.selectedFilters = [];
		this.selectedFilters.push(...this.filterOptions?.filter(item => item.value != '' && item.value == this.selectedFilter));
	}

	handleItemRemove(event) {
		const name = event.detail.item.name;
		const index = event.detail.index;
		this.selectedFilters.splice(index, 1);
		this.selectedFilter = '';
	}

	get _CheckList() {
		return this.filterChecklists(this.CheckList);
	}

	filterChecklists(records) {
		this.isLoadingChecklistDetails = true;
		let data = [];

		switch (this.selectedFilter) {
			case 'Today':
				data = this.filterTodaysChecklist(records);
				break;
			
			case 'Open':
				data = this.filterOpenChecklist(records);
				break;

			case 'Completed':
				data = this.filterCompletedChecklist(records);
				break;

			case 'Overdues':
				data = this.filterOverduesChecklist(records);
				break;

			case 'My_Checklist':
				data = this.filterMyChecklist(records);
				break;

			default:
				data = records;
				break;
		}

		this.isLoadingChecklistDetails = false;
		if (data && data.length > 0) {
			return data;
		} else {
			return [];
		}
			
	}

	filterMyChecklist(records) {
		return records.filter((item) => item.OwnerId === loggedInUserId);
	}

	filterTodaysChecklist(records) {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set to the start of the day
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1); // Next day
	
		return records.filter((item) => {
			const dueDate = new Date(item.kt_checklist__Due_Date__c);
			return item.kt_checklist__Percentage_Completion__c != 100 && dueDate >= today && dueDate < tomorrow;
		});
	}	

	filterOpenChecklist(records) {
		return records.filter((item) => item.kt_checklist__Percentage_Completion__c != 100);
	}

	filterCompletedChecklist(records) {
		return records.filter((item) => item.kt_checklist__Percentage_Completion__c == 100);
	}

	filterOverduesChecklist(records) {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set to the start of the day
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1); // Next day
	
		return records.filter((item) => {
			if (item.kt_checklist__Percentage_Completion__c != 100) {
				const dueDate = new Date(item.kt_checklist__Due_Date__c);
				return today > dueDate;
			}
		});
	}

  @wire(getAssignedPermissions)
  wiredData({ error, data }) {
    if (data) {
      	this.hasAdminStandardPermission = data.isStandard ? data.isStandard : false;
		this.hasAdminPermission = data.isAdmin ? data.isAdmin : false;

			if (!this.hasAdminStandardPermission && !this.hasAdminPermission) {
				this.showToast('Error', 'Please Add respective PermissionSet to Use Checklist Genius', 'error');
			} else {
				this.checkValidity();
				// this.isAccessibleActions = true;
		}

    } else if (error) {
      this.showToast('Error', error?.body?.message, 'error');
    }
  }

  connectedCallback() {
	// const toastContainer = ToastContainer.instance();
	// toastContainer.maxToasts = 5;
	// toastContainer.toastPosition = 'top-center';
		

  	// Commented the mobile view 
		if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
  	  this.isMobile1 = true;
			this.checklistBtnStyle = 'white-space: nowrap; font-size: 10px;padding: 0px 5px; display: inline;';
		} else {
			this.checklistBtnStyle = 'white-space: nowrap;';
  	}
  }

  renderedCallback() {
  	Promise.all([
  		// loadStyle( this, this.customStyle )
  		loadStyle(this, this.customCSS)
  	])
  		.then(() => {
  		})
  		.catch((error) => {
  			console.log(error?.body?.message);
  		});
  }

  /*
   * This method checks whether the recordId's object has the Relationship Field in Checklist Object 
   * If we dont have any relations we are hiding the Create Checklist button and showing instructions
   * If we have relations we are showing the Create Checklist button and hiding the instructions and fetching the checklist records linked with this recordId
  */ 
  checkValidity() {
  	if (this.recordId && this.recordId !== '') {
  		getRelatedFieldNameByRecordId({ recordId: this.recordId })
  			.then((result) => {
  				this.checklistLookupField = result;
				if (!this.checklistLookupField || this.checklistLookupField === '' || this.checklistLookupField.fieldApiName === '') {
					this.showInstructions = true;
					this.isAccessibleActions = false;
  				} else {
  					this.showInstructions = false;
						// this.showCreateChecklist = true;
  					this.fetchRecords();
					this.isAccessibleActions = true;
  				}
  			})
  			.catch((err) => {
  				this.showToast('Error While Checking Checklist Relationship', err?.body?.message, 'error');
  				// console.log(JSON.stringify(error));
  			});
		} else {
			this.isAccessibleActions = false;
  	}
  }

  /*
   * This method is used to Fetch the Checklist records linked with the RecordId
   * It is using the Checklist Query component to fetch the records
  */ 
  fetchRecords() {
	this.isLoadingChecklistDetails = true;
  	if (this.recordId && this.recordId !== '') {
  		fetchCheckLists({ recordId: this.recordId })
  			.then((result) => {
  				this.CheckList = result;
				this.isLoadingChecklistDetails = false;
  			})
  			.catch((err) => {
  				this.showToast('Error', err?.body?.message, 'error');
				this.isLoadingChecklistDetails = false;
  				// console.log(
  				//   "Error in Fetching Checklist Records " + JSON.stringify(err)
  				// );
  			});
  	}
  }
	
	handleRemoveChecklist(event) {
		let recId = event.detail.checklistid;
		// Filter the CheckList array to remove the object with the matching recId
		this.CheckList = this.CheckList.filter(item => item.Id !== recId);
	}

	handleupdatechecklist(event) {
		let rec = event.detail.checklist;
		this.replaceChecklist(rec)
	}

	handlecompletedchecklist(event) {
		// this.CheckList = [];
		// this.fetchRecords();
		let rec = event.detail.checklist;
		this.replaceChecklist(rec)
	}

	handleuncompletedchecklist(event) {
		// this.CheckList = [];
		// this.fetchRecords();
		let rec = event.detail.checklist;
		this.replaceChecklist(rec)
	}

	replaceChecklist(rec) {
		//console.log('Rec- '+JSON.stringify(rec));
		this.CheckList = this.CheckList.map(element => {
			//console.log('test- '+rec.Id);
			if (element.Id == rec.Id) {
				return rec;
			} else {
				return element;
			}
		});
	}


  /*
   * This method checks whether any active add item form is availabe in the ChecklistDetail Component (Child)
   * checkIsActiveAddItemOpened this is @Api method in ChecklistDetail Component which is used to check whether any active add item form is availabe.
   * If their is any active availabe we are navigating to the active form and showing a info message.
   * If not we are showing  openCreateChecklistDialog component to select the end user to Select the Checklist type.
  */ 
  handleCreateChecklist() {
  	const isValid = this.template.querySelector('c-checklist-details') ? this.template.querySelector('c-checklist-details').checkIsActiveAddItemOpened() : true;
  	if (isValid) {
  		// Commented the mobile view
			if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
  		   //this.isMobile =true;
  		   //event.preventDefault();
  		   let componentDef = {
  		     componentDef: "kt_checklist:createChecklistDialog",
  		     attributes: {
  		       recordIdOfAcc: this.recordId,
  	       		ShowAsPopUp: false
  		    }
  		   };
  		  //console.log("inside handleCreateChecklist :: " + componentDef);
  		   let encodedComponentDef = btoa(JSON.stringify(componentDef));
  		   //console.log("encodedComponentDef :: " + encodedComponentDef);
  		   this[NavigationMixin.Navigate]({
  		     type: "standard__webPage",
  		     attributes: {
  		       url: "/one/one.app#" + encodedComponentDef
  		     }
  		   });
  		} else {
  		this.openCreateChecklistDialog = true;
  		 }
  	}
  }

  /*
   * This method is used to close the CreateChecklistDialog popup component.
  */ 
  closeDialogModal() {
  	// Commented the mobile view 
		if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
  	  this.isMobile = false;
  	}
  	this.openCreateChecklistDialog = false;
  	//this.connectedCallback();
  }

  /*
   * This method is catch the event from the CreateChecklistDialog popup with the selected checklist type. 
   * Closing the CreateChecklistDialog popup and opening the CreateChecklist popup.
   * We are passing the selected checklist type to CreateChecklist popup.
  */ 
  handleCreateChecklistDialog(event) {
  	//this.closeDialogModal(event);
  	this.openCreateChecklistDialog = false;
  	const SeletcedCheckListType = event.detail;
  	this.openCreateChecklist = true;
  	this.openCreateChecklistType = SeletcedCheckListType;
  }

  /*
   * This method is used to close the CreateChecklist popup component.
  */ 
  handleCloseCreateChecklist() {
  	// Commented the mobile view  
		if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
  	  this.isMobile = false;
  	}
  	this.openCreateChecklist = false;
  }

	handleBackCreateChecklist() {
		this.openCreateChecklist = false;
		this.openCreateChecklistDialog = true;
	}

  /*
   * This method is catch the event from the CreateChecklist popup after Saving the Checklist and items.
   * Adding the new Checklist to the Checklist list to display the Checklists in ChecklistDetail Component.
   * We are also showing a success message to the user.
  */ 
  handleOnAddNewChecklistSuccess(event) {
	const checklistTitle = event.detail.title;
  	const newChecklist = event.detail.checklist;
  	this.showToast(
  		'Success',
  		'New Checklist Added ' +
		 checklistTitle,
  		'success',
  		''
  	);
  	// this.showToast("Success", 'New Checklist Added {0}', "success", [{url : '/'+newChecklist?.Id, label :newChecklist[this.checklistTitle_Field.fieldApiName] }]);

  	// Commented the mobile view 
		if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
  	  this.isMobile = false;
  	}

  	this.openCreateChecklist = false;


	  if (newChecklist !== null && typeof newChecklist === 'object') {
		  if (Object.keys(newChecklist).length >= 1) {
			  let lst = JSON.parse(JSON.stringify(this.CheckList));
			  if (lst) {
				  lst.push(JSON.parse(JSON.stringify(newChecklist)));
			  } else {
				  lst = [JSON.parse(JSON.stringify(newChecklist))];
			  }

			  // this.sortData();
			  this.CheckList = JSON.parse(JSON.stringify(lst));
		  }
	  }

  	
  }

  /*
   * This method is used to sort the all checklists in to order of DueDate Assending.
  */ 
  sortData() {
  	let lst = JSON.parse(JSON.stringify(this.CheckList));
  	lst.sort(function (a, b) {
  		// Convert the date strings to actual Date objects
  		let dateA = new Date(a[DUEDATE_FIELD.fieldApiName]);
  		let dateB = new Date(b[DUEDATE_FIELD.fieldApiName]);

  		// Compare the dates
  		return dateA - dateB;
  	});

  	// lst.sort(function(a, b) {
  	// 	let percentageA = a[PERCENTAGE_COMPLETION_FIELD.fieldApiName];
  	// 	let percentageB = b[PERCENTAGE_COMPLETION_FIELD.fieldApiName];

  	// 	if (percentageA === 100 && percentageB !== 100) {
  	// 		return 1;
  	// 	} else if (percentageA !== 100 && percentageB === 100) {
  	// 		return -1;
  	// 	} else {
  	// 		return 0;
  	// 	}
  	// });
  	this.CheckList = JSON.parse(JSON.stringify(lst));
  }

  

  /*
   * This is a handler method used to show the message to User.
  */
  showToast(title, message, variant, messageLinks) {
  	const evt = new ShowToastEvent({
  		title: title,
  		message: message,
  		variant: variant,
  		messageData: messageLinks && messageLinks !== '' ? messageLinks : ''
  	});
  	this.dispatchEvent(evt);
  }
}