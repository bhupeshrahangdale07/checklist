import { LightningElement, api, track } from 'lwc';
import saveCheckListItems from '@salesforce/apex/CheckListManager.saveCheckListItems';
import createChecklistItem from '@salesforce/apex/CheckListManager.createChecklistItem';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// import { loadStyle } from 'lightning/platformResourceLoader';
import Resource from '@salesforce/resourceUrl/ChecklistGeniusDuc';
// import customCSS from '@salesforce/resourceUrl/customChecklistCSS';

import CHECKLIST_ITEM_OBJECT from '@salesforce/schema/Checklist_Item__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Checklist_Item__c.Description__c';
import CHECK_POINT_FIELD from '@salesforce/schema/Checklist_Item__c.Item__c';
import CHECK_POINT_ORDER_FIELD from '@salesforce/schema/Checklist_Item__c.Item_Order__c';
import CHECKLIST_FIELD from '@salesforce/schema/Checklist_Item__c.Checklist__c';

export default class ChecklistDetailsMob extends LightningElement {
	// @api checkList;

	customStyle = Resource+'/css/style.css';
	unlinked_ICON = Resource+'/style/icons/utility-sprite/svg/symbols.svg#unlinked';
	linked_ICON = Resource+'/style/icons/utility-sprite/svg/symbols.svg#linked';
	accordion_ICON = Resource+'/style/icons/utility-sprite/svg/symbols.svg#switch';

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
    	this.processData();
    }
    get checkList(){
    	// this.processData();
    	return this.checkListData;
    }
    

    connectedCallback() {
    	// debugger;
    }
    renderedCallback(){
    	this.populateCheckValues();

    	// Promise.all([
    	//     loadStyle( this, customCSS )
    	//     // ,
    	//     // loadStyle( this, this.customStyle )            
    	//     ]).then(() => {
    	//         console.log( 'Files loaded' );
    	//     })
    	//     .catch(error => {
    	//         console.log( error.body.message );
    	// });

    }

    processData(){

    	if (this.checkListData && this.checkListData.length > 0) {
    		this.checkListData.forEach(item => {
    			item.isActiveAddItem = false;
    			item.accordionClass = 'slds-accordion__section slds-is-open slds-var-m-bottom_small';
    			item.ProgressbarPercentage = 'width:'+item.Percentage_Completion__c+'%';
    			if (item.Due_Days__c !== null) {
    				let crDate = new Date(item.CreatedDate);
    				let dueDate = new Date(crDate);
    				dueDate.setDate(crDate.getDate() + item.Due_Days__c);
    				const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    				item.finalDueDate = dueDate.toLocaleDateString(this.userLocale, options);
    				item.dueColour = 'clr-green';
    				// debugger;
    				const today = new Date();
    				const todayNoHours = today.setHours(0, 0, 0, 0);
    				const dueDateNoHours = dueDate.setHours(0, 0, 0, 0);
    				if (dueDateNoHours < todayNoHours && item.Percentage_Completion__c < 100) {
    					item.dueColour = 'clr-red';
    					item.progressRingVariant = 'expired';
    				} else if (dueDateNoHours === todayNoHours && item.Percentage_Completion__c < 100) {
    					item.dueColour = 'clr-orange';
    					item.progressRingVariant = 'warning';
    				} else {
    					item.dueColour = 'clr-green';
    					item.progressRingVariant = 'base-autocomplete';
    				}
                    
    			}

    			if (item.Checklist_Items__r) {
    				item.Checklist_Items__r.forEach(each => {
    					each.CheckboxDisabled = false;
                        
    					if (!each.Checked__c || each.Checked__c === '') {
    						each.Checked = false;
    						each.iconVariant = 'error';
    					} else if (each.Checked__c === 'Yes') {
    						each.Checked = true;
    						each.iconVariant = '';
    					} else if (each.Checked__c === 'No') {
    						each.Checked = false;
    						each.iconVariant = 'error';
    					} else {
    						each.iconVariant = 'error';
    						each.Checked = false;
    						each.CheckboxDisabled = true;
    					}
                        
    					if (each.iconVariant !== 'error') {
    						each.iconClass = 'noDropPointer';
    					} else {
    						each.iconClass = 'cursorPointer';
    					}
    				});
    			}
    		});
            
    	}
    }

    async handleAccordian(event) {

    	const checklistId = event.target.dataset.checklistid;

    	// Find the section element associated with the clicked button
    	const sectionElement = this.template.querySelector(`.slds-accordion__section[data-checklistid="${checklistId}"]`);
    	if (sectionElement && sectionElement.classList?.contains('slds-is-open')) {
    		sectionElement.classList.remove('slds-is-open');
    	}else{
    		sectionElement.classList.add('slds-is-open');
    	}
    	// var checklistId = event.target.dataset.checklistid;
    	// this.checkListData = await this.checkListData.map(item => {
    	//     if (item.Id === checklistId) {
    	//         if (item.accordionClass?.includes('slds-is-open')) {
    	//             item.accordionClass = item.accordionClass.replace('slds-is-open', '');
    	//         } else {
    	//             item.accordionClass = item.accordionClass + ' slds-is-open';
    	//         }
    	//         return item;
    	//     }
    	//     return item;
    	// });
    }

    populateCheckValues(){
    	// setTimeout(() => {
    	const checkboxes = this.template.querySelectorAll('input[type="checkbox"][name="ChecklistItem"]');
    	// Iterate through the checkboxes and do something
    	if(checkboxes){
    		checkboxes.forEach((checkbox) => {
    			if((/true/i).test(checkbox.value) === true){
    				checkbox.checked = checkbox.value;
    			}
    		});
    	}
    	// }, 1000);
    }

    handleCheckbox(event) { 
    	var Checked = event.target.checked;
    	var checkListItemId = event.currentTarget.dataset.itemid;
    	let element = event.target;
    	const checkListId = event.currentTarget.dataset.checklistid;

    	const CheckVal = Checked ? 'Yes' : 'No';

    	saveCheckListItems({ recordId: checkListItemId, isChecked: CheckVal })
    		.then(() => {
    			this.reCalculateProgressBar(checkListId, checkListItemId, CheckVal);
    		}).catch(() => {
    			element.checked = !Checked;
    			element.value = !Checked;
    		});
    }

    handleNotApplicable(event){
    	var Checked = event.currentTarget.dataset.checked;
    	var checkedvalue = event.currentTarget.dataset.checkedvalue;
    	if(Checked === 'true' || checkedvalue === 'Yes'){
    		return;
    	}

    	const checkListItemId = event.currentTarget.dataset.itemid;
    	const checkListId = event.currentTarget.dataset.checklistid;
    	const CheckVal = checkedvalue === undefined || checkedvalue === 'No' || checkedvalue === ''  ? 'Not Applicable' : 'No';

    	saveCheckListItems({ recordId: checkListItemId, isChecked: CheckVal })
    		.then(() => {
    			this.reCalculateProgressBar(checkListId, checkListItemId, CheckVal);
    			this.populateCheckValues();
    		}).catch(() => {
                
    		});
    }

    
    reCalculateProgressBar(checkListId, checklistItemId, checkValue){
    	let dt = JSON.parse(JSON.stringify(this.checkListData));
    	if (dt && dt.length > 0) {
    		dt.forEach(item => {

    			if(item.Id === checkListId){
    				let p = item.Percentage_Completion__c;
    				let checked = 0;
                

    				if (item.Checklist_Items__r) {
    					item.Checklist_Items__r.forEach(each => {
    						if(each.Id === checklistItemId){
    							each.Checked__c = checkValue;
    						}

    						each.CheckboxDisabled = false;
    						if (!each.Checked__c || each.Checked__c === '') {
    							each.Checked__c = '';
    							each.Checked = false;
    							each.iconVariant = 'error';
    						} else if (each.Checked__c === 'Yes') {
    							checked++;
    							each.Checked = true;
    							each.iconVariant = '';
    						} else if (each.Checked__c === 'No') {
    							each.Checked = false;
    							each.iconVariant = 'error';
    						} else {
    							checked++;
    							each.iconVariant = 'error';
    							each.Checked = false;
    							each.CheckboxDisabled = true;
    						}

    						if (each.iconVariant !== 'error') {
    							each.iconClass = 'noDropPointer';
    						} else {
    							each.iconClass = 'cursorPointer';
    						}
    					});
    				}
    				p = item.Checklist_Items__r ? ( checked / item.Checklist_Items__r?.length )* 100 : 100;
    				item.Percentage_Completion__c = Math.ceil(p);
    				item.ProgressbarPercentage = 'width:'+p+'%';
    			}
    		});

    		this.checkListData = [...dt];
    	}
    }

    handleAddItem(event){
    	var checklistId = event.currentTarget.dataset.checklistid;
    	// var btn = event.target.label;
    	if(this.isActiveAddItemOpened){
    		this.showToast('Info', 'Info', 'Please complete the active Item form first.' );
    	}else if(!this.isActiveAddItemOpened){
    		this.updateAddItemIsActiveStatus(true, checklistId);
    		// this.isActiveAddItemOpened = true;
    	}else{
    		// this.isActiveAddItemOpened = false;
    		this.updateAddItemIsActiveStatus(false, checklistId);
    	}
        
    }
    
    handleAddItemCancel(event){
    	var checklistId = event.currentTarget.dataset.checklistid;     
    	// this.isActiveAddItemOpened = false;
    	this.updateAddItemIsActiveStatus(false, checklistId);
        
    }

    updateAddItemIsActiveStatus(isActive, checklistId){
    	this.checkListData = this.checkListData.map(item => {
    		if (item.Id === checklistId) {
    			this.isActiveAddItemOpened = isActive;
    			item.isActiveAddItem = isActive;
    			return item;
    		}
    		return item;
    	});
    }

    async handleSubmitAddItemForm(event){
    	// debugger;
    	var isValid = await this.validateForm();
    	const checklistrecordId = event.currentTarget.dataset.checklistid;
    	this.addItem.Item_Order__c = parseInt(this.getNumberOfItem(checklistrecordId)) + 1;
    	if(isValid){
    		createChecklistItem({ Item: JSON.stringify(this.addItem), checklistId: checklistrecordId })
    			.then((result) => {
    				this.replaceChecklistFromMainList(result);
    			}).catch((err) => {
    				console.log(JSON.stringify(err));
    			});
    	} 
    }

    getNumberOfItem(checklistrecordId) {
    	const item = this.checkListData.find(record => record.Id === checklistrecordId);
    	if (item && item.Checklist_Items__r) {
    		const checklistItemsLength = item.Checklist_Items__r.length;
    		return checklistItemsLength;
    	} 
    	return 1;
        
    }

    validateForm() {
    	const allValid = [ this.template.querySelector(`[data-fieldname="${this.checkPointField.fieldApiName}"]`), this.template.querySelector(`[data-fieldname="${this.descriptionField.fieldApiName}"]`) 
    		// ...this.template.querySelectorAll('lightning-input[name="myInputName"]'),
    		// ...this.template.querySelectorAll('lightning-textarea')
    	].reduce((validSoFar, inputCmp) => {
    		inputCmp.reportValidity();
    		return validSoFar && inputCmp.checkValidity();
    	}, true);

    	if (allValid) {
    		return true;
    	} 
    	// alert('Please update the invalid form entries and try again.');
    	return false;
        
    }

    async handleChangeAddItemFormField(event){
    	const fieldValue = event.target.value;
    	const fieldname = event.target.dataset.fieldname;
    	const inputElement = event.currentTarget;

    	inputElement.reportValidity();
    	const isValid = inputElement.checkValidity();

    	if (isValid) {
    		if(this.addItem){
    			this.addItem[fieldname] = fieldValue;
    		}else{
    			this.addItem = {};
    			this.addItem[fieldname] = fieldValue;
    		}
    	} else {
    		console.log(`Field '${fieldname}' is not valid.`);
    	}
    }

    async replaceChecklistFromMainList(updatedChecklist){
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

    	this.reCalculateProgressBar(updatedChecklist.Id, '', '');
    }

    showToast(title, variant, message ){
    	const event = new ShowToastEvent({
    		title: title && title !== '' ? title :'Info',
    		variant: variant && variant !== '' ? variant :'info',
    		message: message && message !== '' ? message :'Please complete the active Item form first.',
    	});
    	this.dispatchEvent(event);
    }
}