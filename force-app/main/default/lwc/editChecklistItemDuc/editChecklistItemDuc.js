import { api, wire, LightningElement, track } from 'lwc';
import saveEditedChecklistItem from '@salesforce/apex/CheckListManagerDuc.saveEditedItem'; // we need to update class Name it before packaging******************************************************

import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import REFRESH_MESSAGE from '@salesforce/messageChannel/RefreshMessageChannel__c';

export default class EditChecklistItemDuc extends NavigationMixin(LightningElement) {

    @api itemParentChecklistTitle;
    @api itemToBeEdited;
    @api descToBeEdited;
    @api itemToBeEditedId;
    //@api currentRecordId;
    @api pathUrl;
    @track itemData;
    cancleClicked = false;

    @api isNavigatedFromMyChecklist = false;

    @wire(MessageContext)
    messageContext;



    handleupdatedItem(event) {
        this.itemToBeEdited = event.target.value;
        console.log('***updatedItem:' + this.updatedItem);
    }

    handleupdatedDesc(event) {
        this.descToBeEdited = event.target.value;
        console.log('***updatedDesc:' + this.updatedDesc);
    }

    handleSaveEditedItem() {
        let isValid = this.validateEditForm();		
        if (isValid) {
            saveEditedChecklistItem({ itemId: this.itemToBeEditedId, updatedItem: this.itemToBeEdited, updatedDesc: this.descToBeEdited })
                .then((result) => {
                    // this.reCalculateProgressBar(checkListId, checkListItemId, CheckVal);
                    if (result) {
                        console.log('***result:' + result)
                        this.showToast('Success', 'success', 'Checklist item \'' + this.itemToBeEdited + '\' edited successfully.');
                        //this.replaceChecklistItemFromMainList(result);
                        this.itemData = result;
                        this.cancleClicked = false;
                        this.navigateToHomePage();
                    }
                }).catch((err) => {
                    this.showToast('Error', 'error', err?.body?.message);
                });

            
        }

    }

    validateEditForm() {
		const itemField = this.template.querySelector('.dialogItemEdit'); // Select only the item field
	
		if (itemField) {
			itemField.value = itemField.value?.trim(); // Trim whitespace
			if (!itemField.value) {
				itemField.setCustomValidity('This field is required'); // Show error message
				itemField.reportValidity();
				return false; // Validation failed
			} else {
				itemField.setCustomValidity(''); // Clear error
				itemField.reportValidity();
			}
		}
		
		return true; // Validation passed
	}

    closeDialogModal() {
        this.cancleClicked = true
        this.navigateToHomePage();

    }

    showToast(title, variant, message) {
        const event = new ShowToastEvent({
            title: title && title !== '' ? title : 'Info',
            variant: variant && variant !== '' ? variant : 'info',
            message: message && message !== '' ? message : 'Something went wrong.',
        });
        this.dispatchEvent(event);
    }

    navigateToHomePage() {
        if(this.cancleClicked == false){
        const messaage = {
            data: this.itemData
          };
      
          publish(this.messageContext, REFRESH_MESSAGE, messaage);
        }
        window.history.back();
        //var pageRef;

    // if (this.isNavigatedFromMyChecklist) {
    //     pageRef = {
    //         type: 'standard__navItemPage',
    //         attributes: {
    //             apiName: 'kt_checklist__MyChecklistDuc'
    //         }
    //     };

    //     this[NavigationMixin.Navigate](pageRef);
    // } else {
        // pageRef = {
        //     type: 'standard__recordPage',
        //     attributes: {
        //         recordId: this.currentRecordId,
        //         actionName: 'view'
        //     }
        // };

        // this[NavigationMixin.Navigate](pageRef);
       
    // }

    
        // if (this.pathUrl.includes('/lightning/n/kt_checklist__MyChecklistDuc')) {

        //     this[NavigationMixin.Navigate]({
        //         type: 'standard__navItemPage',
        //         attributes: {
        //             apiName: 'kt_checklist__MyChecklistDuc'
        //         }
        //     }, true);
        // } else {

        //     this[NavigationMixin.Navigate]({
        //         type: 'standard__recordPage',
        //         attributes: {
        //             recordId: this.currentRecordId,
        //             actionName: 'view'
        //         }
        //     }, true);
        // }
        //window.history.back();

    }


}