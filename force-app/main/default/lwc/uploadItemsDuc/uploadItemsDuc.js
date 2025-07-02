import { LightningElement, track, api } from 'lwc';

import DESCRIPTION_FIELD from '@salesforce/schema/Checklist_Item__c.Description__c';
import CHECK_POINT_FIELD from '@salesforce/schema/Checklist_Item__c.Item__c';
import CHECK_POINT_ORDER_FIELD from '@salesforce/schema/Checklist_Item__c.Item_Order__c';
import CHECKLIST_FIELD from '@salesforce/schema/Checklist_Item__c.Checklist__c';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class UploadItemsDuc extends LightningElement {

    descriptionField = DESCRIPTION_FIELD;
    checkPointField = CHECK_POINT_FIELD;
    checkPointOrderField = CHECK_POINT_ORDER_FIELD;
    checklistField = CHECKLIST_FIELD;

    @track addItem;
    @api checklistId;
    @api title = 'Create Checklist Item';

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
    // async handleChangeAddItemFormField(event) {
    //     event.preventDefault();
    //     const fieldValue = event.target.value;
    //     const fieldname = event.target.dataset.fieldname;
    //     const inputElement = event.currentTarget;

    //     inputElement.reportValidity();
    //     const isValid = inputElement.checkValidity();

    //     if (isValid) {
    //         if (this.addItem) {
    //             this.addItem[fieldname] = fieldValue.trim();
    //         } else {
    //             this.addItem = {};
    //             this.addItem[fieldname] = fieldValue.trim();
    //         }
    //     } else {
    //         //console.log(`Field '${fieldname}' is not valid.`);
    //     }
    // }

    /*
     * This method is used submit the AddItem form once all inputs are valid then dispaching the saveadditem event to submit.
    */
    async handleSubmitAddItemForm(event) {
        //event.preventDefault();
        //  let checklistId = event.currentTarget.dataset.checklistid;

        // let isValid = await this.validateForm();
        // const checklistrecordId = event.currentTarget.dataset.checklistid;
        // if (isValid) {
        console.log('this.addItem : ' + this.checklistItems);
        this.dispatchEvent(new CustomEvent('saveadditem', {
            detail: this.checklistItems
        }));
        // }
    }

    /*
     * This method is used to validate the form inputs.
    */
    // validateForm() {
    //     const allValid = [this.template.querySelector(`[data-fieldname="${this.checkPointField.fieldApiName}"]`), this.template.querySelector(`[data-fieldname="${this.descriptionField.fieldApiName}"]`)
    //         // ...this.template.querySelectorAll('lightning-input[name="myInputName"]'),
    //         // ...this.template.querySelectorAll('lightning-textarea')
    //     ].reduce((validSoFar, inputCmp) => {
    //         inputCmp.value = inputCmp?.value?.trim();
    //         inputCmp.reportValidity();
    //         return validSoFar && inputCmp.checkValidity();
    //     }, true);

    //     if (allValid) {
    //         return true;
    //     }
    //     // alert('Please update the invalid form entries and try again.');
    //     return false;

    // }

    /*
     * This method is used to cancel the active form.
    */
    handleAddItemCancel(event) {
        this.addItem = undefined;
        event.preventDefault();
        let checklistId = event.currentTarget.dataset.checklistid;

        this.dispatchEvent(new CustomEvent('canceladditem', {
            detail: checklistId
        }));
    }


    @track checklistItems = [];

    // Define columns for lightning-datatable
    columns = [
        { label: 'Item Name', fieldName: this.checkPointField.fieldApiName, type: 'text', editable: true },
        { label: 'Description', fieldName: this.descriptionField.fieldApiName, type: 'text', editable: true },
        {
            label: 'Action',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                name: 'delete',
                variant: 'border-filled',
                alternativeText: 'Delete'
            }
        }
    ];

    @track draftValues = [];
    handleSave(event) {
        // event.stopPropagation();
        // event.preventDefault();

        let saveDraftValues = event.detail.draftValues;
        // Update local checklistItems array
        var records = this.checklistItems.map(item => {
            let draft = saveDraftValues.find(draftItem => draftItem[this.checkPointField.fieldApiName] === item[this.checkPointField.fieldApiName]);
            return draft ? { ...item, ...draft } : item; // Merge changes if draft exists
        });

        this.checklistItems = [...records];
        this.draftValues = [];
    }

    handleCellChange(event){
        // event.stopPropagation();
        // event.preventDefault();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = () => {
                const text = reader.result;
                this.parseCSV(text);
            };
            reader.readAsText(file);
        }
    }

    parseCSV(csvText) {


        let rows = csvText.split('\n').filter(row => row.trim() !== '');

        if (rows.length < 2) {
            this.showToast('Error', 'CSV file must contain at least one data row.', 'error');
            return;
        }

        // Extract and validate headers
        let headers = rows[0].split(',').map(header => header.trim());


        const REQUIRED_COLS = new Set(['item', 'item__c']);

        if (!headers.some(item => REQUIRED_COLS.has(item.toLowerCase()))) {
            this.showToast('Error', 'CSV file must have "Item" or "Item__c"', 'error');
            return;
        }



        let parsedItems = [];

        // rows.forEach((row, index) => {
        //     if (index !== 0) { // Skip the header row
        //         let columns = row.split(',');
        //         parsedItems.push({
        //             id: index, // Unique key for datatable
        //             name: columns[0] ? columns[0].trim() : '',
        //             description: columns[1] ? columns[1].trim() : ''
        //         });
        //     }
        // });

        var headerMap = {};
        headers = headers.map((currentItem, index) => {
            let lowerCaseItem = currentItem.toLowerCase(); // Convert to lowercase for comparison
            if (headerMap[this.checkPointField.fieldApiName] || headerMap[this.descriptionField.fieldApiName]) {
                return;
            }

            if (lowerCaseItem === 'item__c' || lowerCaseItem === 'item' || lowerCaseItem === this.checkPointField.fieldApiName.toLowerCase()) {
                headerMap[this.checkPointField.fieldApiName] = index;
                return this.checkPointField.fieldApiName;
            } else if (lowerCaseItem === 'description__c' || lowerCaseItem === 'description') {
                headerMap[this.descriptionField.fieldApiName] = index;
                // headerMap[lowerCaseItem] = 'Description__c'.toLowerCase();
                return this.descriptionField.fieldApiName;
            }
        }).filter(Boolean);

        const uniqueHeaders = [...new Set(headers)];

        rows.slice(1).forEach((row, index) => {
            let columns = row.split(',');
            let rowData = {};

            uniqueHeaders.forEach((header, colIndex) => {
                rowData[header] = columns[headerMap[header]] ? columns[headerMap[header]].trim() : '';
            });

            // Validate required field (Item__c)
            if (!rowData[this.checkPointField.fieldApiName]) {
                this.showToast('Error', `Row ${index + 2} is missing Item__c value.`, 'error');
                return;
            }

            if (this.checklistId) {
                rowData[this.checklistField.fieldApiName] = this.checklistId;
            }
 
            parsedItems.push(rowData);
        });

        this.checklistItems = parsedItems;
        console.log('Parsed Checklist Items:', JSON.stringify(this.checklistItems, null, 2));

        console.log('Parsed Checklist Items:', this.checklistItems);
    }

    handleRowAction(event) {
        // event.stopPropagation();
        // event.preventDefault();
        const actionName = event.detail.action.name;
        const rowId = event.detail.row[this.checkPointField.fieldApiName];

        if (actionName === 'delete') {
            this.checklistItems = this.checklistItems.filter(row => row[this.checkPointField.fieldApiName] !== rowId);
        }
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}