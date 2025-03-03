import { LightningElement, api, track } from 'lwc';
import saveCheckListItems from '@salesforce/apex/CheckListManager.saveCheckListItems';
import createChecklistItem from '@salesforce/apex/CheckListManager.createChecklistItem';
import deleteChecklist from '@salesforce/apex/CheckListManager.deleteChecklist';

// commented because their might be a case where the owner can be a Queue
// import hasPermission_Owner_Can_Delete_Checklist from '@salesforce/customPermission/Owner_Can_Delete_Checklist';
// import hasPermission_Created_User_Can_Delete_Checklist from '@salesforce/customPermission/Created_User_Can_Delete_Checklist';
// import hasPermission_Delete_Checklist from '@salesforce/customPermission/Delete_Checklist';
import loggedInUserId from '@salesforce/user/Id';

import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// import { loadStyle } from 'lightning/platformResourceLoader';
import Resource from '@salesforce/resourceUrl/ChecklistGenius';
// import customCSS from '@salesforce/resourceUrl/customChecklistCSS';

import CHECKLIST_ITEM_OBJECT from '@salesforce/schema/Checklist_Item__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Checklist_Item__c.Description__c';
import CHECK_POINT_FIELD from '@salesforce/schema/Checklist_Item__c.Item__c';
import CHECK_POINT_ORDER_FIELD from '@salesforce/schema/Checklist_Item__c.Item_Order__c';
import CHECKLIST_FIELD from '@salesforce/schema/Checklist_Item__c.Checklist__c';
import DUEDATE_FIELD from '@salesforce/schema/Checklist__c.Due_Date__c';

import readOnlyPage from './checklistDetailsReadOnly.html';
import defaultPage from './checklistDetails.html';


export default class ChecklistDetails extends LightningElement {
	@api flexipageRegionWidth;
	viewChecklistItemActivity = false; //Make it true when we want to release Item Activity feature
	@api enableEditMode;


	@api hasAdminPermission = false;
	@api hasAdminStandardPermission = false;

	customStyle = Resource + '/css/style.css';
	unlinked_ICON = Resource + '/style/icons/utility-sprite/svg/symbols.svg#unlinked';
	linked_ICON = Resource + '/style/icons/utility-sprite/svg/symbols.svg#linked';
	accordion_ICON = Resource + '/style/icons/utility-sprite/svg/symbols.svg#switch';
	
	noCLIcon = Resource + '/style/icons/action/Empty-state.svg';

    @track checkListData;

    objectApiName = CHECKLIST_ITEM_OBJECT;
    descriptionField = DESCRIPTION_FIELD;
    checkPointField = CHECK_POINT_FIELD;
    checkPointOrderField = CHECK_POINT_ORDER_FIELD;
    checklistField = CHECKLIST_FIELD;

    @track addItem;
    @track isActiveAddItemOpened;

    @api
    set checkList(value) {
    	this.checkListData = JSON.parse(JSON.stringify(value));
    	this.processSorting();
    	this.processData();
    }
	get checkList() {
    	// this.processData();
    	// this.processSorting();
    	return this.checkListData;
    }
    
	get ischeckListDataAvailable() {
    	return this.checkListData && this.checkListData.length > 0;
    }

	render() {
		return this.enableEditMode ? defaultPage : readOnlyPage;
		// return readOnlyPage;

	}

	connectedCallback() { }

	renderedCallback() {
    	this.populateCheckValues();
    }

	/*
	 * This method is used Check is their any active Add Item Form.
	 * This method also called from Checklist Index when we click on New Checklist button the this method will trigger.
	 * Then navigating to that form. If that accordian is collapsed then we are Expanding and naviagting to the active Form and Show a message to user.
	*/
	@api checkIsActiveAddItemOpened() {
    	const inputElement = this.template.querySelector(`lightning-input[data-fieldname="${this.checkPointField.fieldApiName}"]`);
    	if (inputElement) {
    		const checklistId = inputElement.dataset.checklistid;
    		const sectionElement = this.template.querySelector(`.slds-accordion__section[data-checklistid="${checklistId}"]`);
    		if (sectionElement && !sectionElement.classList?.contains('slds-is-open')) {
    			sectionElement.classList.add('slds-is-open');
    		}

    		inputElement.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    		inputElement.reportValidity();
    		inputElement.focus();
			this.showToast('Info', 'Info', 'Please complete the active Item form first.');
    		return false;
    	}
    	return true;
			
    }

	/*
	 * This method is used to process the List of checklist and prepare the Checklist with required data.
	*/
	processData() {

    	if (this.checkListData && this.checkListData.length > 0) {
    		this.checkListData.forEach(item => {
				
				item.isDeletable = this.hasAdminPermission;
				if (!this.hasAdminPermission) {
					if (this.hasAdminStandardPermission && item.CreatedById === loggedInUserId) {
						item.isDeletable = true;
					}

					// commented because their might be a case where the owner can be a Queue
					// else if(hasPermission_Owner_Can_Delete_Checklist && item.OwnerId === loggedInUserId){
					// 	item.isDeletable = true;
					// }
				}

    			item.isActiveAddItem = false;
    			item.accordionClass = 'slds-accordion__section slds-is-open slds-var-m-bottom_small';
				item.ProgressbarPercentage = item.kt_checklist__Percentage_Completion__c + '%'; //'width:'+item.kt_checklist__Percentage_Completion__c+'%';
    			this.processDueDate(item);

    			if (item.kt_checklist__Checklist_Items__r) {
    				item.kt_checklist__Checklist_Items__r.forEach(each => {
    					each.CheckboxDisabled = false;
						each.showDetails = false;
						each.CompletedBy = each.kt_checklist__CompletedBy__r?.Name;
						each.CompletedDate = each.kt_checklist__CompletedDate__c;
						each.CompletedByLink = each.kt_checklist__CompletedBy__c ? "/lightning/r/User/" + each.kt_checklist__CompletedBy__c + "/view" : '';
                        
    					if (!each.kt_checklist__Checked__c || each.kt_checklist__Checked__c === '') {
    						each.Checked = false;
    						each.iconVariant = 'error';
    					} else if (each.kt_checklist__Checked__c === 'Yes') {
    						each.Checked = true;
    						each.iconVariant = '';
							each.showDetails = true;

							// each.CompletedBy = each.kt_checklist__CompletedBy__r?.Name;
							// each.CompletedDate = each.kt_checklist__CompletedDate__c;
							// each.CompletedByLink = "/lightning/r/User/" + each.kt_checklist__CompletedBy__c + "/view";

    					} else if (each.kt_checklist__Checked__c === 'No') {
    						each.Checked = false;
    						each.iconVariant = 'error';
    					} else {
    						each.iconVariant = 'error';
    						each.Checked = false;
    						each.CheckboxDisabled = true;
							each.showDetails = true;
							each.isNotApplicable = true;
							each.isApplicable = false;



							// each.CompletedBy = each.kt_checklist__CompletedBy__r?.Name;
							// each.CompletedDate = each.kt_checklist__CompletedDate__c;
							// each.CompletedByLink = "/lightning/r/User/"+ each.kt_checklist__CompletedBy__c +"/view";
    					}
                        
    					if (each.iconVariant !== 'error') {
							each.iconClass = 'kt_checklist__noDropPointer';
    					} else {
							each.iconClass = 'kt_checklist__cursorPointer';
    					}
    				});

					//console.log('item.kt_checklist__Sequential__c:', item.kt_checklist__Sequential__c);
					//Call Sequential method here
					this.handleSequential(item);


    			}
    		});
    	}
    	// this.processSorting();
	}

	/*
	 * This method is ues to process the duedate with due days and set the Date Color class and progressRingVariant color.
	*/
	processDueDate(item) {
		if (item.kt_checklist__Due_Days__c === undefined) {
    		item.kt_checklist__Due_Days__c = 0;
    	}

    	if (item.kt_checklist__Due_Days__c !== null) {
    		let crDate = new Date(item.CreatedDate);
    		let dueDate = new Date(crDate);
    		dueDate.setDate(crDate.getDate() + item.kt_checklist__Due_Days__c);
    		const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    		item.finalDueDate = dueDate.toLocaleDateString(this.userLocale, options);
			item.dueColour = 'kt_checklist__clr-green';
    		const today = new Date();
    		const todayNoHours = today.setHours(0, 0, 0, 0);
    		const dueDateNoHours = dueDate.setHours(0, 0, 0, 0);
			// item.clTimelineClasses = 'slds-media slds-timeline__item_expandable slds-timeline__item_task slds-is-open';

			//let timelineColour = '#1B96FF'; // Default blue
    		if (dueDateNoHours < todayNoHours && item.kt_checklist__Percentage_Completion__c < 100) {
				item.dueColour = 'kt_checklist__clr-red';
    			item.progressRingVariant = 'expired';
				// item.clTimelineClasses = item.clTimelineClasses + ' timelineIncomplete';

    		} else if (dueDateNoHours === todayNoHours && item.kt_checklist__Percentage_Completion__c < 100) {
				item.dueColour = 'kt_checklist__clr-orange';
    			item.progressRingVariant = 'warning';
				// item.clTimelineClasses = item.clTimelineClasses + ' timelineIncomplete';

    		} else {
				item.dueColour = 'kt_checklist__clr-green';
    			item.progressRingVariant = 'base-autocomplete';
				if (item.kt_checklist__Percentage_Completion__c < 100) {
					// item.clTimelineClasses = item.clTimelineClasses + ' timelineIncomplete';
				} else {
					// item.clTimelineClasses = item.clTimelineClasses + ' timelineCompleted';
				}

    		}
			
    	}
	}


	/*
	 * This method is used to sort the all checklists in to order of DueDate Assending.
	 * This method is triggered everytime when the 'checkList' is setted or Changed.
	*/ 
	processSorting() {
    	let lst = JSON.parse(JSON.stringify(this.checkListData));
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
    	this.checkListData = JSON.parse(JSON.stringify(lst));
	}

	/*
	 * This method is used to Collapse or Expand the Accourdian of Each Checklist by adding/removing the 'slds-is-open' Class
	*/
	async handleAccordian(event) {
    	const checklistId = event.currentTarget.dataset.checklistid;
    	this.checkListData = await this.checkListData.map(item => {
    	    if (item.Id === checklistId) {
    	        if (item.accordionClass?.includes('slds-is-open')) {
    	            item.accordionClass = item.accordionClass.replace('slds-is-open', '');
    	        } else {
    	            item.accordionClass = item.accordionClass + ' slds-is-open';
    	        }
    	        return item;
    	    }
    	    return item;
    	});
	}

	/*
	 * This method is used to set the Checkboxes as checked or uchecked using elements value property
	 * Called from Rendered Callback.
	*/
	populateCheckValues() {
    	// setTimeout(() => {
    	const checkboxes = this.template.querySelectorAll('input[type="checkbox"][name="ChecklistItem"]');
    	// Iterate through the checkboxes and do something
		if (checkboxes) {
    		checkboxes.forEach((checkbox) => {
				if ((/true/i).test(checkbox.value) === true) {
    				checkbox.checked = checkbox.value;
    			}
    		});
    	}
    	// }, 1000);
	}

	/*
	 * This method is used Save the Item is checked or unchecked. 
	 * saveCheckListItems is the apex method used to save item and if any exception occurs then we are reverting the Checkbox back and showing the Error message. 
	 * Then calling reCalculateProgressBar to process the data and prepare the formatte data to this specific checklist like progress ring color and percentage or Completion and etc.
	*/
	handleCheckbox(event) { 
    	let Checked = event.target.checked;
    	let checkListItemId = event.currentTarget.dataset.itemid;
    	let element = event.target;
    	const checkListId = event.currentTarget.dataset.checklistid;

    	const CheckVal = Checked ? 'Yes' : 'No';

    	saveCheckListItems({ recordId: checkListItemId, isChecked: CheckVal })
			.then((result) => {
				// this.reCalculateProgressBar(checkListId, checkListItemId, CheckVal);
				if (result) {
					this.replaceChecklistItemFromMainList(result);
				}
    		}).catch((err) => {
    			this.showToast('Error', 'error', err?.body?.message);
    			element.checked = !Checked;
    			element.value = !Checked;
    		});
	}

	updateToParent(checkListId, checkListItemId, CheckVal) {
		checkListId, checkListItemId, CheckVal
	}

	/*
	 * This method is used Save the Item is Not Applicable. 
	 * saveCheckListItems is the apex method used to save item and if any exception occurs then we are reverting the Checkbox back and showing the Error message. 
	 * Then calling reCalculateProgressBar to process the data and prepare the formatte data to this specific checklist like progress ring color and percentage or Completion and etc.
	*/
	handleNotApplicable(event) {
    	let Checked = event.currentTarget.dataset.checked;
    	let checkedvalue = event.currentTarget.dataset.checkedvalue;
    	if (Checked === 'true' || checkedvalue === 'Yes') {
    		return;
    	}

    	const checkListItemId = event.currentTarget.dataset.itemid;
    	const checkListId = event.currentTarget.dataset.checklistid;
    	const CheckVal = checkedvalue === undefined || checkedvalue === 'No' || checkedvalue === '' ? 'Not Applicable' : 'No';

    	saveCheckListItems({ recordId: checkListItemId, isChecked: CheckVal })
			.then((result) => {

				if (result) {
					// this.reCalculateProgressBar(checkListId, checkListItemId, CheckVal);
					this.replaceChecklistItemFromMainList(result);
    			this.populateCheckValues();
				}
    		}).catch((err) => {
    			this.showToast('Error', 'error', err?.body?.message);
    		});
	}

	/*
	 * This method is used to replace the ChecklistItem with the latest Item to Main List. 
	*/
	async replaceChecklistItemFromMainList(updatedChecklistItem) {
		let updatedChecklist = {};
		this.checkListData = await this.checkListData.map(item => {
			if (item.Id === updatedChecklistItem.kt_checklist__Checklist__c) {
				item.kt_checklist__Checklist_Items__r = item.kt_checklist__Checklist_Items__r.map(rec => {
					if (rec.Id === updatedChecklistItem.Id) {
						return updatedChecklistItem;
					} else {
						return rec;
					}
				});

				updatedChecklist = item;
				return item;
			}
			return item;
		});



		if (this.viewChecklistItemActivity) {
			this.dispatchEvent(new CustomEvent('handleitemchange', {
				detail: { checklistid: updatedChecklist.Id, checklist: updatedChecklist }
			}));
		}
		//console.log('***In replaceChecklistItemFromMainList, befr this.reCalculateP...');
		this.reCalculateProgressBar(updatedChecklist.Id, updatedChecklistItem.Id, updatedChecklistItem.kt_checklist__Checked__c);
	}

	/*
	 * This method is used to process the checklist and prepare the Checklist with required data.
	 * handleuncompletedchecklist event will dispatch when completed checklist is marked as unCompleted.
	 * handlecompletedchecklist event will dispatch when checklist is completed.
	*/
	reCalculateProgressBar(checkListId, checklistItemId, checkValue) {
    	let dt = JSON.parse(JSON.stringify(this.checkListData));
    	if (dt && dt.length > 0) {
    		dt.forEach(item => {

				if (item.Id === checkListId) {
    				let p = item.kt_checklist__Percentage_Completion__c;
    				const percent = item.kt_checklist__Percentage_Completion__c;
    				let checked = 0;
                

    				if (item.kt_checklist__Checklist_Items__r) {
    					item.kt_checklist__Checklist_Items__r.forEach(each => {
							if (each.Id === checklistItemId) {
    							each.kt_checklist__Checked__c = checkValue;
    						}

    						each.CheckboxDisabled = false;
							each.isNotApplicable = false;
							each.isApplicable = true;

    						if (!each.kt_checklist__Checked__c || each.kt_checklist__Checked__c === '') {
    							each.kt_checklist__Checked__c = '';
    							each.Checked = false;
    							each.iconVariant = 'error';
    						} else if (each.kt_checklist__Checked__c === 'Yes') {
    							checked++;
    							each.Checked = true;
    							each.iconVariant = '';
								each.showDetails = true;
								each.CompletedBy = each.kt_checklist__CompletedBy__r?.Name;
								each.CompletedDate = each.kt_checklist__CompletedDate__c;
								each.CompletedByLink = "/lightning/r/User/" + each.kt_checklist__CompletedBy__c + "/view";
    						} else if (each.kt_checklist__Checked__c === 'No') {
    							each.Checked = false;
    							each.iconVariant = 'error';
    						} else {
    							checked++;
    							each.iconVariant = 'error';
    							each.Checked = false;
    							each.CheckboxDisabled = true;
								each.isNotApplicable = true;
								each.isApplicable = false;
								
								each.showDetails = true;
								each.CompletedBy = each.kt_checklist__CompletedBy__r?.Name;
								each.CompletedDate = each.kt_checklist__CompletedDate__c;
								each.CompletedByLink = "/lightning/r/User/" + each.kt_checklist__CompletedBy__c + "/view";
    						}

    						if (each.iconVariant !== 'error') {
								each.iconClass = 'kt_checklist__noDropPointer';
    						} else {
								each.iconClass = 'kt_checklist__cursorPointer';
    						}
    					});

						this.handleSequential(item);
						
    				}
					p = item.kt_checklist__Checklist_Items__r ? (checked / item.kt_checklist__Checklist_Items__r?.length) * 100 : 100;

					item.kt_checklist__Percentage_Completion__c = Math.floor(p);

    				this.processDueDate(item);
					
    				//item.ProgressbarPercentage = Math.floor(p)+'%'; //'width:'+p+'%';
					//console.log('percent '+ percent +' p- '+p);
					if (percent !== Math.floor(p)) {
						if (percent <= 100 && p === 100) {
    						// this.processSorting();
    						// trigger on complete event
    						this.dispatchEvent(new CustomEvent('handlecompletedchecklist', {
    							detail: { checklistid: item.Id, checklist: item }
    						}));
						} else if (percent === 100 && p <= 100) {
    						// this.processSorting();
    						// trigger on complete event
    						this.dispatchEvent(new CustomEvent('handleuncompletedchecklist', {
								detail: { checklistid: item.Id, checklist: item }
    						}));
    					}
    				}
					item.ProgressbarPercentage = Math.floor(p) + '%'; //'width:'+p+'%';

					this.sendUpdatedChecklistToParent(item);

    			}
    		});

    		this.checkListData = [...dt];
    	}
	}

	sendUpdatedChecklistToParent(checklist) {
		this.isActiveAddItemOpened = false;
		this.dispatchEvent(new CustomEvent('handleupdatechecklist', {
			detail: { checklist: checklist }
		}));
	}

	/*
	 * This method is used to show the Add item form befor showing we will check for any active form is availabe,
	 * if it is available we will show a info message and navigate to that form.
	*/
	handleAddItem(event) {
		this.addItem = undefined;
    	let checklistId = event.currentTarget.dataset.checklistid;
    	// var btn = event.target.label;
		if (this.isActiveAddItemOpened) {
			this.checkIsActiveAddItemOpened();
		} else if (!this.isActiveAddItemOpened) {
    		this.updateAddItemIsActiveStatus(true, checklistId);
    		// this.isActiveAddItemOpened = true;
		} else {
    		// this.isActiveAddItemOpened = false;
    		this.updateAddItemIsActiveStatus(false, checklistId);
    	}
        
	}
    
	/*
	 * This method is used to close the add item form when you click on cancel button.
	*/
	handleAddItemCancel(event) {
		this.addItem = undefined;
    	let checklistId = event.currentTarget.dataset.checklistid;     
    	// this.isActiveAddItemOpened = false;
    	this.updateAddItemIsActiveStatus(false, checklistId);
        
	}

	/*
	 * This method is used to update the checkListData for the specifice checklist is active add item form.
	*/
	updateAddItemIsActiveStatus(isActive, checklistId) {
    	this.checkListData = this.checkListData.map(item => {
    		if (item.Id === checklistId) {
    			this.isActiveAddItemOpened = isActive;
    			item.isActiveAddItem = isActive;
    			return item;
    		}
    		return item;
    	});
	}

	/*
	 * This method is used to create Item for that Checklist.
	 * Disabling the Save button to save duplicate and enabling if any exceptions occurs.
	 * createChecklistItem is the apex method will create a checklist Item and return the specific Parent with childs Which means Checklist with Checklist Items.
	*/
	async handleSubmitAddItemForm(event) {
		let element = event.target;
		element.disabled = true;
    	let isValid = await this.validateForm();
    	const checklistrecordId = event.currentTarget.dataset.checklistid;
    	
		if (isValid) {
			this.addItem.kt_checklist__Item_Order__c = parseInt(this.getNumberOfItem(checklistrecordId), 10) + 1;
    		createChecklistItem({ Item: JSON.stringify(this.addItem), checklistId: checklistrecordId })
    			.then((result) => {
					this.showToast('Success', 'Success', 'Checklist Item added Successfully to ' + result.kt_checklist__Checklist_Title__c);
					
    				this.replaceChecklistFromMainList(result);
					element.disabled = false;
    			}).catch((err) => {
					this.showToast('Failed to Save Item', 'error', err?.body?.message);
					element.disabled = false;
    			});
		} else {
			element.disabled = false;
		} 
	}

	/*
	 * This method is used to get the number of items (count) available to that specific checklist to maintain Order for newly creating Item.
	*/
	getNumberOfItem(checklistrecordId) {
    	const item = this.checkListData.find(record => record.Id === checklistrecordId);
    	if (item && item.kt_checklist__Checklist_Items__r) {
    		const checklistItemsLength = item.kt_checklist__Checklist_Items__r.length;
    		return checklistItemsLength;
    	} 
    	return 1;
        
	}

	/*
	 * This method is used to Validate the Inputs of Add Items.
	*/
	validateForm() {
		const allValid = [this.template.querySelector(`[data-fieldname="${this.checkPointField.fieldApiName}"]`), this.template.querySelector(`[data-fieldname="${this.descriptionField.fieldApiName}"]`)
    		// ...this.template.querySelectorAll('lightning-input[name="myInputName"]'),
    		// ...this.template.querySelectorAll('lightning-textarea')
    	].reduce((validSoFar, inputCmp) => {
			inputCmp.value = inputCmp?.value?.trim();
    		inputCmp.reportValidity();
    		return validSoFar && inputCmp.checkValidity();
    	}, true);

    	if (allValid) {
    		return true;
    	} 
    	// alert('Please update the invalid form entries and try again.');
    	return false;
        
	}

	/*
	 * This method is used to capture the Inputs of Add item form and Creating/Assigning to a Object called 'addItem'.
	*/
	async handleChangeAddItemFormField(event) {
		
    	const fieldValue = event.target.value;
    	const fieldname = event.target.dataset.fieldname;
    	const inputElement = event.currentTarget;

    	inputElement.reportValidity();
    	const isValid = inputElement.checkValidity();

    	if (isValid) {
			if (this.addItem) {
    			this.addItem[fieldname] = fieldValue.trim();
			} else {
    			this.addItem = {};
    			this.addItem[fieldname] = fieldValue.trim();
    		}
    	} else {
			//console.log(`Field '${fieldname}' is not valid.`);
			// this.showToast('Error', 'error', `Field '${fieldname}' is not valid.` )
    	}
	}

	/*
	 * This method is used to replace the Checklist with its Items with the Newly Added Item's Checklist to Main List. 
	*/
	async replaceChecklistFromMainList(updatedChecklist) {
    	// this.checkList = await this.checkListData.map(item => {
    	this.checkListData = await this.checkListData.map(item => {
    		if (item.Id === updatedChecklist.Id) {
    			let rec = JSON.parse(JSON.stringify(updatedChecklist));
    			rec.isActiveAddItem = false;
    			rec.finalDueDate = item.finalDueDate;
    			rec.dueColour = item.dueColour;
    			rec.accordionClass = 'slds-accordion__section slds-is-open slds-var-m-bottom_small';
    			this.isActiveAddItemOpened = false;
    			return rec;
    		}
    		return item;
    	});

		this.dispatchEvent(new CustomEvent('handleuncompletedchecklist', {
			detail: { checklistid: updatedChecklist.Id, checklist: updatedChecklist }
		}));

    	this.reCalculateProgressBar(updatedChecklist.Id, '', '');
		// this.processSorting();
	}

	async handleDeleteChecklist(event) {
		let title = event.target.dataset.title;
		let checklistId = event.target.dataset.checklistid;

		const result = await LightningConfirm.open({
			message: 'Are you sure you want to delete ' + title,
			theme: 'warning',
			label: 'Delete Checklist',
		});
		
		if (result) {
			deleteChecklist({ checklistId: checklistId })
			.then((result) => {
				this.dispatchEvent(new CustomEvent('deletechecklist', {
					detail: { checklistid: checklistId }
				}));
				
					this.showToast('Successfully', 'success', 'Successfully Deleted Checklist ' + title);
			}).catch((err) => {
					this.showToast('Failed while deleting Checklist.', 'error', err?.body?.message);
			});
		}
	}

	/*
	* This is a handler method used to show the message to User.
	*/
	showToast(title, variant, message) {
    	const event = new ShowToastEvent({
			title: title && title !== '' ? title : 'Info',
			variant: variant && variant !== '' ? variant : 'info',
			message: message && message !== '' ? message : 'Something went wrong.',
    	});
    	this.dispatchEvent(event);
	}

	/* 
	* This method handles Sequential completion of checklist items
	*/
	handleSequential(checkL) {
		if (checkL.kt_checklist__Sequential__c) {
			// Sort the checklist items by order field
			checkL.kt_checklist__Checklist_Items__r.sort(
				(a, b) => a.kt_checklist__Item_Order__c - b.kt_checklist__Item_Order__c
			);

			let previousChecked = true;  // Track if the previous item is checked
			let lastCheckedIndex = -1;   // Track the last checked item for reverse unchecking
			let lastNAIndex = -1;   // Track the last NA item for reverse working

			// First pass- Identify last checked item
			// checkL.kt_checklist__Checklist_Items__r.forEach((each, index) => {
			// 	if (each.Checked || each.kt_checklist__Checked__c === 'Not Applicable') {
			// 		lastCheckedIndex = index;
			// 	}
			// 	if (!each.Checked && each.kt_checklist__Checked__c !== 'Not Applicable') {
			// 		lastNAIndex = index;
			// 	}
			// });

			// Second pass- Handle enabling and disabling checkboxes
			// checkL.kt_checklist__Checklist_Items__r.forEach((each, index) => {
			// 	// Disable all items by default
			// 	each.CheckboxDisabled = true;
			// 	each.iconClass = '';
			// 	each.iconVariant = '';

			// 	// Always disable Not Applicable items
			// 	if (each.kt_checklist__Checked__c === 'Not Applicable') {
			// 		each.CheckboxDisabled = true;
			// 		each.iconVariant = 'error';
			// 		each.iconClass = 'kt_checklist__cursorPointer';
			// 		return;  // Skip to the next item
			// 	}

			// 	// Enable the first unmarked item if the previous valid one is checked (valid - not Not Applicable)
			// 	if (!each.Checked && previousChecked) {
			// 		each.CheckboxDisabled = false;
			// 		previousChecked = false;  // Only the first unchecked item should be enabled
			// 		each.iconVariant = 'error';
			// 		each.iconClass = 'kt_checklist__cursorPointer';
			// 	}

			// 	// Enable only the last checked item for unchecking
			// 	if (index === lastCheckedIndex) {
			// 		each.CheckboxDisabled = false;
			// 		each.iconVariant = '';
			// 		each.iconClass = 'kt_checklist__noDropPointer';
			// 		console.log('***each:',each);
			// 	}
			// 	// Enable only the last Not Applicable item
			// 	if (index == lastNAIndex) {
			// 		each.iconVariant = 'error';
			// 		each.iconClass = 'kt_checklist__cursorPointer';
			// 	}

			// 	if(each.CheckboxDisabled){
			// 		each.style = 'pointer-events: none;cursor: default;';
			// 	}else{
			// 		each.style = '';
			// 	}

			// });


			if(checkL.kt_checklist__Checklist_Items__r &&  checkL.kt_checklist__Checklist_Items__r.length){
				var lastIndex = checkL.kt_checklist__Checklist_Items__r.length - 1;
				checkL.kt_checklist__Checklist_Items__r.forEach((each, index) => {
					each.checklistLockedNotApplicable = false;
					each.checklistUnLockedNotApplicable = true;
					if(index ==  0){
						each.style = '';
						each.CheckboxDisabled = each.CheckboxDisabled ? true : false;
					}else{
						each.style = 'pointer-events: none;cursor: default;';
						each.CheckboxDisabled = true;
					}

					if (each.Checked || each.kt_checklist__Checked__c === 'Not Applicable') {
						each.timelineClasses = 'slds-media slds-timeline__item_expandable slds-timeline__item_task slds-is-open timeline-success';

						if(index < lastIndex){
							var nextIndex  = index + 1;
							if(checkL.kt_checklist__Checklist_Items__r[nextIndex].Checked || checkL.kt_checklist__Checklist_Items__r[nextIndex].kt_checklist__Checked__c === 'Not Applicable'){
								each.CheckboxDisabled = true;
								each.style = 'pointer-events: none;cursor: default;';
							}else{
								each.style = '';
								each.CheckboxDisabled = each.kt_checklist__Checked__c === 'Not Applicable' ? true : false;
							} 

							if(each.CheckboxDisabled){
								checkL.kt_checklist__Checklist_Items__r[nextIndex].CheckboxDisabled = false;
								checkL.kt_checklist__Checklist_Items__r[nextIndex].style = '';
								checkL.kt_checklist__Checklist_Items__r[nextIndex].checklistLockedNotApplicable = false;
								// checkL.kt_checklist__Checklist_Items__r[nextIndex].checklistUnLockedNotApplicable = true;
							}
						}else{
							var previousIndex = index - 1;
							if(previousIndex < lastIndex && previousIndex >= 0){
								each.CheckboxDisabled = each.kt_checklist__Checked__c === 'Not Applicable' ? true : false;
								each.style = '';

								var np =  checkL.kt_checklist__Checklist_Items__r[previousIndex].kt_checklist__Checked__c;
								checkL.kt_checklist__Checklist_Items__r[previousIndex].CheckboxDisabled = true;
								checkL.kt_checklist__Checklist_Items__r[previousIndex].style = 'pointer-events: none;cursor: default;';
								checkL.kt_checklist__Checklist_Items__r[previousIndex].checklistLockedNotApplicable = np === 'Not Applicable' ? true : false;
								checkL.kt_checklist__Checklist_Items__r[previousIndex].checklistUnLockedNotApplicable = np !== 'Not Applicable' ? true : false;
							}
						}
					}else{
						each.timelineClasses = 'slds-media slds-timeline__item_expandable slds-timeline__item_task slds-is-open timeline-default';
						var previousIndex = index - 1;
						if(previousIndex < lastIndex && previousIndex >= 0){
							if(checkL.kt_checklist__Checklist_Items__r[previousIndex].Checked || checkL.kt_checklist__Checklist_Items__r[previousIndex].kt_checklist__Checked__c === 'Not Applicable'){
								each.CheckboxDisabled = false;
								each.style = '';
							}
						}
					}

					if(each.style == ''){
						each.itemStyle = 'margin: 5px;'; //'background-color:lemonchiffon';
					}else if(each.style == 'pointer-events: none;cursor: default;' && each.kt_checklist__Checked__c === 'Not Applicable'){
						each.checklistLockedNotApplicable = true;
						each.checklistUnLockedNotApplicable = false;
						each.itemStyle = 'margin: 5px;';
					}else{
						each.itemStyle = 'margin: 5px;';
					}

				});
			}
		}
	}
}