import { LightningElement, track, api } from 'lwc';

import DESCRIPTION_FIELD from '@salesforce/schema/Checklist_Item__c.Description__c';
import CHECK_POINT_FIELD from '@salesforce/schema/Checklist_Item__c.Item__c';
import CHECK_POINT_ORDER_FIELD from '@salesforce/schema/Checklist_Item__c.Item_Order__c';
import CHECKLIST_FIELD from '@salesforce/schema/Checklist_Item__c.Checklist__c';

export default class ChecklistAddItemForm extends LightningElement {

	descriptionField = DESCRIPTION_FIELD;
	checkPointField = CHECK_POINT_FIELD;
	checkPointOrderField = CHECK_POINT_ORDER_FIELD;
	checklistField = CHECKLIST_FIELD;

    @track addItem;
    @api checklistId;

    /*
	 * This method is used to navigate to active form elements
	*/
    renderedCallback() {
    	const targetDiv = this.template.querySelector('.btn-cancel');
    	if (targetDiv) {
    		targetDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    	}
    }


    /*
	 * This method is used to capture the Inputs of Add item form and Creating/Assigning to a Object called 'addItem'.
	*/
    async handleChangeAddItemFormField(event){
    	event.preventDefault();
    	const fieldValue = event.target.value;
    	const fieldname = event.target.dataset.fieldname;
    	const inputElement = event.currentTarget;

    	inputElement.reportValidity();
    	const isValid = inputElement.checkValidity();

    	if (isValid) {
    		if(this.addItem){
    			this.addItem[fieldname] = fieldValue.trim();
    		}else{
    			this.addItem = {};
    			this.addItem[fieldname] = fieldValue.trim();
    		}
    	} else {
    		//console.log(`Field '${fieldname}' is not valid.`);
    	}
    }

    /*
	 * This method is used submit the AddItem form once all inputs are valid then dispaching the saveadditem event to submit.
	*/
    async handleSubmitAddItemForm(event){
    	event.preventDefault();
    	//  let checklistId = event.currentTarget.dataset.checklistid;
        
    	 let isValid = await this.validateForm();
    	// const checklistrecordId = event.currentTarget.dataset.checklistid;
    	if(isValid){
    		this.dispatchEvent(new CustomEvent('saveadditem', {
    			detail : this.addItem
    		})); 
    	}
    }
	  
    /*
	 * This method is used to validate the form inputs.
	*/
    validateForm() {
    	const allValid = [ this.template.querySelector(`[data-fieldname="${this.checkPointField.fieldApiName}"]`), this.template.querySelector(`[data-fieldname="${this.descriptionField.fieldApiName}"]`) 
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
	 * This method is used to cancel the active form.
	*/
    handleAddItemCancel(event) {
    	this.addItem = undefined;
    	event.preventDefault();
    	let checklistId = event.currentTarget.dataset.checklistid;

    	this.dispatchEvent(new CustomEvent('canceladditem', {
    		detail : checklistId
    	}));
    }
}