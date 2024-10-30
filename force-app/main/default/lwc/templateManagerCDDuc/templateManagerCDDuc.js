import { LightningElement, api, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getTemplateItems from '@salesforce/apex/TemplateManager.getTemplateItems';
import saveTemplateAndItems from '@salesforce/apex/TemplateManager.saveTemplateAndItems';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import Is_Locked_FIELD from '@salesforce/schema/Checklist_Template__c.IsLocked__c';
import Active_FIELD from '@salesforce/schema/Checklist_Template__c.Active__c';
import Sequential_FIELD from '@salesforce/schema/Checklist_Template__c.Sequential__c';
import Name_FIELD from '@salesforce/schema/Checklist_Template__c.Name';
import DueDays_FIELD from '@salesforce/schema/Checklist_Template__c.Due_Days__c';
import { loadStyle } from 'lightning/platformResourceLoader';
import Resource from '@salesforce/resourceUrl/ChecklistGeniusDuc';
//import customCSS from '@salesforce/resourceUrl/customChecklistCSS';

export default class TemplateManager extends NavigationMixin(LightningElement) {
    dueDaysField = DueDays_FIELD;

    openCreateChecklistTemplDialog = true;
    @api recordId;
    @track headerTitle = 'Create/Edit Checklist Template';
    @track templateRecord = {};
    @track templateItems = [];
    @track deleteItems = [];
    @track isMobile = false; //Uncomment this code when Mobile designs are continued developing
    @track row;
    @track showfirstCmp = true;
    @track showSecondCmp = true;
    @track showPerviousBtn = false;

    isActive = false;
    isLocked = false;
    isSequential = false;
    editForm = true;
    nameValue = '';
    dueDaysValue = '';
    descriptionValue;

    customCSS = Resource + '/css/style.css';

    /*
    * Assigns the current value of the toggle to the local variables when any of the two toggles Active and Locked is clicked upon.
    */
    handleToggle(event) {
        if (event.target.name === 'togglevalue1') {
            this.isLocked = event.target.checked;
        } else if (event.target.name === 'togglevalue2'){
            this.isActive = event.target.checked;
        } else{
            this.isSequential = event.target.checked;
            console.log('this.isSequential:'+this.isSequential);
        }
    }
    handleInputChange(event) {
        const field = event.target.dataset.fieldname;
        if (field == 'Name') {
            this.nameValue = event.target.value;
        }
        if (field == 'kt_checklist__Due_Days__c') {
            this.dueDaysValue = event.target.value;
        }
        this.descriptionValue = this.template.querySelector('lightning-input-field[data-name="kt_checklist__Description__c"]').value;

    }
    disablePullToRefresh () {
        // CustomEvent is standard JavaScript. See:
        // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
        const disable_ptr_event = new CustomEvent("updateScrollSettings", {
            detail: {
                isPullToRefreshEnabled: false
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(disable_ptr_event);
    }

    connectedCallback() {
        this.disablePullToRefresh();
        /* Uncomment this code when Mobile designs are continued developing*/
        if (FORM_FACTOR == 'Small' || FORM_FACTOR == 'Medium' ) {
            this.isMobile = true;
            this.showSecondCmp = false;
        }
        this.fetchRecords();
    }

    renderedCallback() {
        /*Uncomment this code when Mobile designs are continued developing  */
        if (FORM_FACTOR == 'Small' || FORM_FACTOR == 'Medium') {
            let layoutItems = this.template.querySelectorAll('lightning-layout-item:not(.notinclude)');
            if (layoutItems) {
                layoutItems.forEach(item => {
                    item.classList.add('add-width');
                });
            }
            const buttonElements = this.template.querySelectorAll('.changeButton');
            buttonElements.forEach(buttonElement => {
                buttonElement.classList.remove('btn-primary');
                buttonElement.classList.add('btn-cancel');
                buttonElement.style.fontSize = 'small';
            });

            const divElement = this.template.querySelector('.toRemoveClass');
            if (divElement) {
                divElement.classList.remove('slds-p-left_xx-large', 'slds-p-right_xx-large', 'slds-var-m-left_large', 'slds-var-m-right_x-large');
            }
            const tdElements = this.template.querySelectorAll('.target-td');
            if (tdElements) {
                tdElements.forEach(td => {
                    td.style.padding = '0px';
                });
            }
            const tdElement = this.template.querySelectorAll('.target-td1');
            if (tdElement) {
                tdElement.forEach(td => {
                    td.style['padding-right'] = '8px';
                });
            }
            const tdElement2 = this.template.querySelectorAll('.target-td2');
            if (tdElement2) {
                tdElement2.forEach(td => {
                    td.style['border-left'] = '1px solid rgb(0,0,0,0.1)';
                    td.style['border-top'] = '1px solid rgb(0,0,0,0.1)';
                    td.style['border-bottom'] = '1px solid rgb(0,0,0,0.1)';
                    td.style['border-radius'] = '8px 0 0 8px';
                });
            }
            const inputElements = this.template.querySelectorAll('lightning-input.my-custom-input');
            inputElements.forEach(input => {
                input.style.fontSize = 'small';
            });
            const textareaElements = this.template.querySelectorAll('lightning-textarea.my-custom-input');
            textareaElements.forEach(input => {
                input.style.fontSize = 'small';
            });
            const labelElements = this.template.querySelectorAll('.centerAlighment');
            if (labelElements) {
                labelElements.forEach(label => {
                    label.style.paddingBottom = '8px';
                });
            }
           
            const style = document.createElement('style');
            style.innerText = `.outputField, .outputField lightning-formatted-lookup.slds-form-element__static, .outputField lightning-formatted-text.slds-form-element__static {
                    font-size: 12px;
                    white-space: nowrap;
                }lightning-layout-item.slds-size_6-of-12.slds-form-element__label.fullWidthCls.slds-col.slds-size_5-of-12{
                    display:grid;
                }.paddingClass button.slds-button {
                    padding: 0px 18px;
                    font-size: 14px;
                    font-weight: 400;
                }button.slds-button.slds-button_brand {
                   padding: 0px 24px;
                }.help-icon label.slds-form-element__label.slds-no-flex {
                    padding-right:-10px;
                }`;
            this.template.querySelector('div').appendChild(style);

        }
       
         const style1 = document.createElement('style');
        style1.innerText = `.help-icon label.slds-form-element__label.slds-no-flex {
                padding-right:0px;
            }`;
        this.template.querySelector('label').appendChild(style1);
        // if(FORM_FACTOR === 'Small' || FORM_FACTOR === 'Medium'){
		// 	const style = document.createElement('style');
		// 		style.innerText = `div {
		// 			background-color: #fff !Important;
		// 			}
		// 	`;
		// 	this.template.querySelector('div')?.appendChild(style);
		// }

        this.loadCss();

    }
    get dynamicStyle() {
        return this.isMobile ? '' : 'border-right: 1px solid #ccc;';
    }
    get dynamicClasses() {
        return this.isMobile ? 'slds-col' : 'slds-col slds-size_1-of-2';
    }


    async onNextClick() {

        const allValid = [
            ...this.template.querySelectorAll('lightning-input')
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.value = inputCmp?.value?.trim();
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        this.prepareObject();
        if (allValid && this.isMobile == true) {
            this.showfirstCmp = false;
            this.showSecondCmp = true;
            this.showPerviousBtn = true;
        }
    }
    onPreviousClick() {
        if (this.isMobile = true) {
            this.showfirstCmp = true;
            this.showSecondCmp = false;
            this.showPerviousBtn = false;
        }
    }

    loadCss() {
        Promise.all([
            // loadStyle( this, this.customStyle )            
            loadStyle(this, this.customCSS)
        ]).then(() => {
        }).catch(error => {
            console.log('loadCss error:',error);
        });
    }

    // createdBy;
    // lastModBy;
    // createdDate;
    // lastModDate;

    /*
    * Fetches the Checklist Template record data for Edit, and creates an empty form with an empty Item for New.
    */

    async fetchRecords() {
        if (!this.recordId) {
            this.isActive = true;
            this.isLocked = false;
            this.isSequential = false;
            this.editForm = false;
            this.headerTitle = 'Create Checklist Template';
            let row = { 'kt_checklist__Item__c': '', 'kt_checklist__Item_Order__c': this.templateItems.length + 1, 'kt_checklist__Description__c': '' };
            this.templateItems.push(row);
            return;
        }

        await getTemplateItems({ recordId: this.recordId })
            .then((data) => {
                //console.log('Data*- '+JSON.stringify(data));
                this.templateRecord = data;

                let checklistTemplateTitleElement = this.template.querySelector(
                    `[data-fieldname="${Name_FIELD.fieldApiName}"]`
                );
                if (checklistTemplateTitleElement) {
                    checklistTemplateTitleElement.value = data[Name_FIELD.fieldApiName];
                }

                let checklistDueDaysElement = this.template.querySelector(
                    `[data-fieldname="${DueDays_FIELD.fieldApiName}"]`
                );
                if (checklistDueDaysElement) {
                    checklistDueDaysElement.value = data[DueDays_FIELD.fieldApiName];
                }

                if (data[Active_FIELD.fieldApiName]) {
                    this.isActive = data[Active_FIELD.fieldApiName];
                }
                if (data[Is_Locked_FIELD.fieldApiName]) {
                    this.isLocked = data[Is_Locked_FIELD.fieldApiName];
                }
                if (data[Sequential_FIELD.fieldApiName]) {
                    this.isSequential = data[Sequential_FIELD.fieldApiName];
                }
                this.descriptionValue = data['kt_checklist__Description__c'];

                this.editForm = true;
                this.headerTitle = 'Edit Checklist Template';

                // this.createdBy = data['CreatedById'];
                // this.lastModBy = data['LastModifiedById'];
                // this.createdDate = data['CreatedDate'];
                // this.lastModDate = data['LastModifiedDate'];

                let dt = data.kt_checklist__Checklist_Template_Items__r;
                this.templateItems = dt ? dt : [];



            }).catch((err) => {
                this.handleShowToast('Error fetching Template Items', err?.body?.message, 'error', '');
            });
    }

    /*
    * Generic method to show toast message on UI. Can be called from multiple places.
    */
    handleShowToast(title, message, variant, mode) {
        // const activeInputElement = this.template.activeElement;
        // const isInputFocused = this.template.activeElement.tagName.toLowerCase() === 'lightning-input';

        // Create and dispatch the event
        const event = new ShowToastEvent({
            title: title && title !== '' ? title : 'Success',
            message: message && message !== '' ? message : 'This is a success toast message!',
            variant: variant && variant !== '' ? variant : 'success',
            mode: mode && mode !== '' ? mode : 'dismissable'
        });
        this.dispatchEvent(event); // Display the toast

        // if (isInputFocused) {
        //     setTimeout(() => {
        //         activeInputElement.focus();
        //     }, 15);
        // }
    }

    // @wire(getTemplateItems, { recordId:"$recordId"})
    // wiredRecords({ error, data }) {
    //     if (data) {
    //         this.templateRecord = data;
    //         var dt = data.Checklist_Template_Items__r;
    //         this.templateItems = dt;
    //     }else if (error) {
    //         alert('Something Went Wrong While retrieving Template Items : '+JSON.stringify(error));
    //     }
    // }

    /*
    * This method is called on either Delete Item or Add Item icon/button click.
    * Based on whether 'index' value exists in the event, it decides whether the Item (row) is to be deleted or a new Item is to be added and does it accordingly.
    */
    handleRowAction(event) {
        var index = event.target.dataset.rowindex;
        if (index && this.templateItems.length >= index) {
            index = parseInt(index, 10);
            const dlt = this.templateItems.splice(index, 1);
            if (dlt && dlt[0] && dlt[0].Id && dlt[0].Id !== '') {
                this.deleteItems.push(dlt[0]);
            }

            //this.processOrderNumber();

        } else if (!index) {
            let row = { 'kt_checklist__Item__c': '', 'kt_checklist__Item_Order__c': this.templateItems.length + 1, 'kt_checklist__Description__c': '' };
            this.templateItems.push(row);
        }
    }

    /*
    * This method shows a baloon message if the Item that is being typed (edited) is exactly the same as any other Item in the Checklist Template.
    */
    handleItemChange(event) {
        const index = event.target.dataset.rowindex;
        const field = event.target.label;
        const newValue = event.target.value.trim().toLowerCase();

        if (field === 'kt_checklist__Item__c') {
            this.isDuplicate = this.templateItems.some((item, itemIndex) => {
                const lowercasedItemValue = item.kt_checklist__Item__c.trim().toLowerCase();
                return newValue === lowercasedItemValue && itemIndex !== parseInt(index, 10);
            });

            if (this.isDuplicate) {
                // Update the `showDuplicateMessage` property on the specific item object
                this.templateItems[index].showDuplicateMessage = true;

                // Optionally, update the duplicate message content dynamically
                // (if the message needs to vary based on context)
                // this.templateItems[index].duplicateMessage = "Duplicate found: " + newValue;

                // Schedule a re-render to reflect the changes
                this.dispatchEvent(new CustomEvent('change')); // Or use a more specific event if needed
            } else {
                // Clear the `showDuplicateMessage` property if the item is no longer a duplicate
                this.templateItems[index].showDuplicateMessage = false;
            }
        }

        if (index && this.templateItems.length >= index) {
            this.templateItems[index][field] = event.target.value;
        }
    }

    /*
    * 
    */
    DragStart(event) {
        this.row = event.target.closest('tr');
        this.dragStart = event.target.dataset.rowindex;

        //event.target.classList.add("drag");
        const parentTr = event.target.closest('tr');
        if (parentTr) {
            //parentTr.style.backgroundColor = 'lightblue'; 
            //parentTr.classList.add("drag");
        }
        //event.currentTarget.classList.add("grabbed");
    }


    DragOver(event) {
        event.preventDefault();

        // Ensure the event target is a table row
        if (event.target.closest('tr')) {
            const targetRow = event.target.closest('tr');

            // Check if the dragged row is different from the target row
            if (this.row !== targetRow || this.row?.dataset?.key !== targetRow?.dataset?.key) {

                const parent = targetRow.parentNode;
                const rows = Array.from(parent.children);

                // Determine the position to insert the dragged row
                const newIndex = rows.indexOf(targetRow);

                // Reorder the rows in the DOM
                if (newIndex > -1) {
                    if (this.row.rowIndex < newIndex) {
                        // Insert the dragged row after the target row
                        parent.insertBefore(this.row, targetRow.nextSibling);
                    } else {
                        // Insert the dragged row before the target row
                        parent.insertBefore(this.row, targetRow);
                    }
                }
            }
        }

        // Implement Scrolling Logic
        const cursorY = event.clientY;
        const viewportHeight = window.innerHeight;
        const scrollThreshold = 150;

        if (cursorY < scrollThreshold) {
            window.scrollBy(0, -15);
        } else if (cursorY > viewportHeight - scrollThreshold) {
            window.scrollBy(0, 10);
        }

    }


    Drop(event) {
        event.stopPropagation();

    }

    moveElement(array, fromIndex, toIndex) {
        if (fromIndex === toIndex) {
            return array; // No need to move if indexes are the same
        }

        const elementToMove = array[fromIndex];//.splice(fromIndex, 1)[0]; // Remove the element to be moved
        const elementFromMove = array[toIndex];//.splice(toIndex, 1)[0];
        array[toIndex] = elementToMove;
        array[fromIndex] = elementFromMove;

        return array;
    }

    handleOnLoad() {

    }
 
    prepareObject(event) {
        let fields = this.templateRecord;
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );

        if (inputFields) {
            inputFields.forEach(field => {
                //console.log('field' + JSON.stringify(field));

                fields[field.fieldName] = field.value;
            });
        }


        //console.log('Fields- ' + JSON.stringify(fields));
        fields.Id = this.recordId;

        fields[Is_Locked_FIELD.fieldApiName] = this.isLocked;
        fields[Active_FIELD.fieldApiName] = this.isActive;
        fields[Sequential_FIELD.fieldApiName] = this.isSequential;
        // if (this.isMobile = true) {
        //     fields["kt_checklist_Description_c"] = this.descriptionValue;
        //     alert('Fields- ' + JSON.stringify(fields));
        // }
        let checklistTemplateTitleElement = this.template.querySelector(
            `[data-fieldname="${Name_FIELD.fieldApiName}"]`
        );
        if (checklistTemplateTitleElement) {
            fields[Name_FIELD.fieldApiName] = checklistTemplateTitleElement.value;
            this.nameValue = checklistTemplateTitleElement.value;
        }

        let checklistDueDaysElement = this.template.querySelector(
            `[data-fieldname="${DueDays_FIELD.fieldApiName}"]`
        );
        if (checklistDueDaysElement) {
            fields[DueDays_FIELD.fieldApiName] = checklistDueDaysElement.value;
            this.dueDaysValue = checklistDueDaysElement.value;
        }

        this.templateRecord = undefined;
        this.templateRecord = fields;

    }

    async handleSubmit(event) {
        let fields = {};

        event.preventDefault();       // stop the form from submitting
        if (this.isMobile) {
            fields = this.templateRecord;
        } else {
            fields = event.detail.fields;

            //console.log('Fields- ' + JSON.stringify(fields));
            fields.Id = this.recordId;

            fields[Is_Locked_FIELD.fieldApiName] = this.isLocked;
            fields[Active_FIELD.fieldApiName] = this.isActive;
            fields[Sequential_FIELD.fieldApiName] = this.isSequential;
            // if(this.isMobile = true){
            //     fields["kt_checklist_Description_c"] = this.descriptionValue;
            //     alert('Fields- '+JSON.stringify(fields));
            // }
            let checklistTemplateTitleElement = this.template.querySelector(
                `[data-fieldname="${Name_FIELD.fieldApiName}"]`
            );
            if (checklistTemplateTitleElement) {
                fields[Name_FIELD.fieldApiName] = checklistTemplateTitleElement.value;
            }

            let checklistDueDaysElement = this.template.querySelector(
                `[data-fieldname="${DueDays_FIELD.fieldApiName}"]`
            );
            if (checklistDueDaysElement) {
                fields[DueDays_FIELD.fieldApiName] = checklistDueDaysElement.value;
            }
        }

        const allValid = [
            ...this.template.querySelectorAll('lightning-input')
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.value = inputCmp?.value?.trim();
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        if (allValid) {
            // const inputFields = this.template.querySelectorAll(
            //     'lightning-input-field'
            // );

            // if (inputFields) {
            //     inputFields.forEach((field) => {
            //         if (field.fieldName === 'Name') {
            //             field.value = field?.value?.trim();
            //             if (field.value === '') {
            //                 //isValid = false;
            //                 field.setErrors('Complete this field.');
            //                 field.reportValidity();
            //                 return;
            //                 // field.focus();
            //             }
            //         }
            //     });
            // }

            //alert('All form entries look valid. Ready to submit!');
            const arrOrder = [];
            const tableRows = this.template.querySelectorAll('tr');

            const hasEmptyTables = tableRows.length === 0;
            if (hasEmptyTables) {
                this.handleShowToast('Error', 'Please add atleast one item before saving.', 'error', '');
                return;
            }

            tableRows.forEach(element => {
                if (element && element.dataset && element.dataset.key) {
                    arrOrder.push(parseInt(element.dataset.key, 10));
                }
            });

            // Create a copy of templateItems with updated Item_Order__c values
            const updatedTemplateItems = this.templateItems.map((item, index) => {
                if (arrOrder.length > index) {
                    return { ...item, kt_checklist__Item_Order__c: arrOrder.indexOf(item.kt_checklist__Item_Order__c) + 1 };
                }
                return item;
            });


            const propertiesToDelete = [
                'kt_checklist__Checklist_Template_Items__r',
                'LastModifiedById',
                'CreatedDate',
                'LastModifiedDate',
                'CreatedById'
            ];
            
            // Deleting properties using a loop
            propertiesToDelete.forEach(property => delete fields[property]);

            // Assign the updated templateItems back to the property
            //this.templateItems = updatedTemplateItems;
            saveTemplateAndItems({ Template: JSON.stringify(fields), TemplateItems: updatedTemplateItems, DeletedTemplateItems: this.deleteItems })
                .then((result) => {
                    this.handleShowToast('', 'Record Saved Successfully', '', '');
                    if (result.Status === 'Success') {
                        //this.recordId = result.recordId;
                        this.fetchRecords();
                        this.navigate('ListView');
                    }
                }).catch((err) => {
                    this.handleShowToast('Error saving Template & Items', err?.body?.message, 'error', '');
                    //this.navigate('ListView');
                });
        } else {
            //alert('Please update the invalid form entries and try again.');
            //this.handleShowToast('Error', 'Please update the invalid form entries and try again.', 'error', '');
        }
}

hideModalBox(){
    if (this.recordId && this.recordId !== '') {
        this.navigate('ListView');
    } else {
        this.navigate('ListView');
    }
}

navigate(str){
    if (str === 'detail') {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view',
            }
        });
    } else {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'kt_checklist__Checklist_Template__c',
                actionName: 'home',
            },
        });
    }

}

handleSuccess(){
}

closeDialogModal() {
    this.openCreateChecklistTemplDialog = false;
}

@track showAddForm = false;
handleAddItem(){
    this.showAddForm = true;
}

handleAddCancel(){
    this.showAddForm = false;
}

tempChecklistItems;
checklistTemporaryData;
        get showAddItems(){
    return this.tempChecklistItems && this.tempChecklistItems.length > 0;
}

handleAddSave(event){
    this.showAddForm = false;
    let addedItem = event.detail;

    let AddedItems = this.tempChecklistItems ? this.tempChecklistItems.length : 0;
    let TempItemsCount = this.selectedTemplate?.kt_checklist__Checklist_Template_Items__r ? this.selectedTemplate.kt_checklist__Checklist_Template_Items__r.length : 0;
    let tempIndex = AddedItems - TempItemsCount;

    let item = {};
    item.Id = 'Temporary-' + tempIndex;
    item.Item__c = addedItem.Item__c;
    //item.Item_Order__c = currentItem.Item_Order__c;
    item.Description__c = addedItem.Description__c;
    item.Checklist__c = '';
    item.isTemplateItem = false;
    if (this.tempChecklistItems) {
        this.tempChecklistItems.push(item);
    } else {
        this.tempChecklistItems = [];
        this.tempChecklistItems.push(item);
    }

}

handleClearAddItem(event){
    event.preventDefault();
    let tempIndex = event.currentTarget.dataset.itemindex;
    // this.tempChecklistItems.push(item);
    this.tempChecklistItems.splice(tempIndex, 1);
    this.processTempItems();
}

handleKeyPress(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        event.target.blur();
    }
}

@track isInputFocused = false;

handleInputFocus(event) {
    this.isInputFocused = true;
    const row = event.target.closest('tr');
    if (row) {
        row.draggable = false;
    }
}

handleInputBlur(event) {
    this.isInputFocused = false;
    const row = event.target.closest('tr');
    if (row) {
        row.draggable = true;
    }
}

handleCloseDuplicateMessage(event) {
    const rowIndex = event.target.dataset.rowindex;

    if (this.templateItems[rowIndex] && this.templateItems[rowIndex]?.showDuplicateMessage) {
        this.templateItems[rowIndex].showDuplicateMessage = false; // Hide the message for the row
    }
}
    }