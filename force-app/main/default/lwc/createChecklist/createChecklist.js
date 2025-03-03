import { LightningElement, api, track, wire } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import getRelatedFieldNameByRecordId from '@salesforce/apex/CheckListManager.getRelatedFieldNameByRecordId';
import fetchTemplate from '@salesforce/apex/CheckListManager.fetchTemplate';
import saveChecklistAndItems from '@salesforce/apex/CheckListManager.saveChecklistAndItems';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import CHECKLIST_OBJECT from '@salesforce/schema/Checklist__c';
import CHECKLIST_TEMPLATE_OBJECT from '@salesforce/schema/Checklist_Template__c';

import CHECKLIST_TITLE_FIELD from '@salesforce/schema/Checklist__c.Checklist_Title__c';
import CHECKLIST_TEMPLATE_FIELD from '@salesforce/schema/Checklist__c.Checklist_Template__c';
import DUE_DAYS_FIELD from '@salesforce/schema/Checklist__c.Due_Days__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Checklist__c.Description__c';
import IS_CHECKLIST_LOCKED_FIELD from '@salesforce/schema/Checklist__c.Is_Checklist_Locked__c';
import IS_CHECKLIST_SEQUENTIAL_FIELD from '@salesforce/schema/Checklist__c.Sequential__c';

import TEMPLATE_ACTIVE_FIELD from '@salesforce/schema/Checklist_Template__c.Active__c';
import TEMPLATE_DESCRIPTION_FIELD from '@salesforce/schema/Checklist_Template__c.Description__c';
import TEMPLATE_DUE_DAYS_FIELD from '@salesforce/schema/Checklist_Template__c.Due_Days__c';
import TEMPLATE_LOCKED_FIELD from '@salesforce/schema/Checklist_Template__c.IsLocked__c';
import TEMPLATE_SEQUENTIAL_FIELD from '@salesforce/schema/Checklist_Template__c.Sequential__c';

import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import ASSIGN_TO_FIELD from '@salesforce/schema/Checklist__c.Assign_To__c';

export default class CreateChecklist extends NavigationMixin(LightningElement) {
	checklistObject = CHECKLIST_OBJECT;
	checklistTemplateObject = CHECKLIST_TEMPLATE_OBJECT;

	checklistTitle_Field = CHECKLIST_TITLE_FIELD;
	checklistTemplate_Field = CHECKLIST_TEMPLATE_FIELD;

	assignTo_Field = ASSIGN_TO_FIELD;
	dueDays_Field = DUE_DAYS_FIELD;
	description_Field = DESCRIPTION_FIELD;
	is_Checklist_Locked_Field = IS_CHECKLIST_LOCKED_FIELD;
	is_Checklist_Sequential_Field = IS_CHECKLIST_SEQUENTIAL_FIELD;

	templateIsActive_Field = TEMPLATE_ACTIVE_FIELD;
	templateDescription_Field = TEMPLATE_DESCRIPTION_FIELD;
	templateDueDays_Field = TEMPLATE_DUE_DAYS_FIELD;
	templateIsLocked_Field = TEMPLATE_LOCKED_FIELD;
	templateIsSequential_Field = TEMPLATE_SEQUENTIAL_FIELD;
	@track fieldApiName = { fieldApiName: "kt_checklist__Assign_To__c", objectApiName: "kt_checklist__Checklist__c" };
	// @api templateType;
	@api recordId;
	showmodal = true;
	showChecklistFields = true;
	tagline;
	addChecklistDueDate;
	@track selectedAssignTo;
	CheckListOwnerId;
	CheckListTemplateId;
	@track selectedAssignedTo;
	checklistLookupField = '';
	// Commented the mobile view 
	@track isMobile = false;

	@track isSubmittedFromSaveAction = false;
	@track divStyle;
	@track formData = {};

	queueFilter = {
		criteria: [
			{
				fieldPath: 'Type',
				operator: 'eq',
				value: 'Queue'
			}
		]
	};

	templateFilter = {
		criteria: [
			{
				fieldPath: 'kt_checklist__Active__c',
				operator: 'eq',
				value: true
			}
		]
	};

	userFilter = {
		criteria: [
			{
				fieldPath: 'IsActive',
				operator: 'eq',
				value: true
			}
		]
	};

	showSpinner = false;
	// isSelected = false;

	@api
	set templateType(value) {
		this.tagline = value;
	}
	get templateType() {
		return this.tagline;
	}

	get showTemplateField() {
		return this.templateType === 'With Template';
	}

	get showUserLookup() {
		return this.selectedAssignTo === 'Pick a User';
	}

	get showQueueLookup() {
		return this.selectedAssignTo === 'Pick a Queue';
	}

	get disableAddItem() {
		var val = false;
		if (
			this.templateType === 'With Template' &&
			this.selectedTemplate &&
			this.selectedTemplate.kt_checklist__IsLocked__c
		) {
			val = true;
		} else {
			val = false;
		}
		return val;
	}

	// displayInfo = {
	// 	primaryField: 'User.Name',
	// 	additionalFields: ['Profile.Name'],
	// };


	@track assignToOptions = { 'values': undefined, 'defaultValue': { 'value': '' } };
	//$fieldApiName added for mobile view
	@wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: '$fieldApiName' })
	wiredAssignToOptions({ error, data }) {
		if (data) {
			this.assignToOptions = data;
			this.formData[this.assignTo_Field.fieldApiName] = data.defaultValue?.value;
			this.selectedAssignedTo = this.assignToOptions.defaultValue.value;
		} else if (error) {
			console.log('Failed in fetching the AssignTo Options' + JSON.stringify(error));
		}
	}

	@wire(getRelatedFieldNameByRecordId, { recordId: '$recordId' })
	wiredData({ error, data }) {
		if (data) {
			this.checklistLookupField = data;
			this.formData[data.fieldApiName] = this.recordId;
		} else if (error) {
			console.log(JSON.stringify(error));
		}
	}

	//   handleBack(){

	//   }

	setDivHeight() {
		let height = window.innerHeight;
		const userAgent = navigator.userAgent;
		if (/iPad|iPhone|iPod/.test(userAgent)) {
			height += 60;
		} else {
			height -= 60;
		}
		this.divStyle = `min-height: ${height}px;`;
	}
	connectedCallback() {
		this.disablePullToRefresh();
		//window.addEventListener("keydown", this.handleKeyDown);
		this.showChecklistFields =
			this.templateType === 'With Template' ? false : true;

		// Commented the mobile view
		if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
			this.isMobile = true;
			this.setDivHeight();
		}
	}

	disconnectedCallback() {
		// Remove event listener when the component is removed from the DOM
		window.removeEventListener('keydown', this.handleKeyDown);
	}

	disablePullToRefresh() {
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

	handleKeyDown(event) {
		// Check if the key pressed is the Enter key
		if (event.key === 'Enter') {
			// Prevent default behavior (form submission)
			event.preventDefault();
		}
	}

	handleOnLoad() {
		const inputFields = this.template.querySelectorAll('lightning-input-field');

		if (inputFields) {
			inputFields.forEach((field) => {
				if (
					this.checklistLookupField !== '' &&
					this.checklistLookupField &&
					field.fieldName === this.checklistLookupField
				) {
					field.value = this.recordId;
				}
			});
		}

		this.showSpinner = false;
	}

	handleFieldChange(event) {
		this.formData[event.dataset.fieldname] = event.detail.value;
	}

	// async fetchTemplateFeilds(event) {
	//   event.stopPropagation();
	//   // if(event.target.value && event.target.value != ''){
	//   this.CheckListTemplateId = event.detail.recordId;
	//   if (event.detail.recordId && event.detail.recordId !== "") {
	//     this.showAddForm = false;
	//     this.showSpinner = true;
	//     this.showChecklistFields = true;
	//     // const templateId = event.target.value;
	//     const templateId = event.detail.recordId;
	//     // this.loadedTemplateDetails = true;
	//     let template;
	//     await fetchTemplate({ recordId: templateId })
	//       .then((result) => {
	//         template = result;
	//         this.selectedTemplate = result;

	//         // this.handleNext(result, templateId);
	//         this.processTempItems();
	//         let ele = this.template.querySelector(
	//           `[data-fieldname="${CHECKLIST_TITLE_FIELD?.fieldApiName}"]`
	//         );
	//         if (ele) ele.value = template.Name;

	//         let dueDateElement = this.template.querySelector(
	//           `[data-fieldname="${this.dueDays_Field?.fieldApiName}"]`
	//         );
	//         if (dueDateElement) {
	//           dueDateElement.value = template.kt_checklist__Due_Days__c;
	//           this.pupulateDueDate(template.kt_checklist__Due_Days__c);
	//         }

	//         const inputFields = this.template.querySelectorAll(
	//           "lightning-input-field"
	//         );

	//         if (inputFields) {
	//           inputFields.forEach((field) => {
	//             if (field.fieldName === "kt_checklist__Checklist_Title__c") {
	//               field.value = template.Name;
	//             } else if (field.fieldName === "kt_checklist__Description__c") {
	//               field.value = template.kt_checklist__Description__c;
	//             } else if (field.fieldName === "kt_checklist__Due_Days__c") {
	//               field.value = template.kt_checklist__Due_Days__c;

	//               this.pupulateDueDate(template.kt_checklist__Due_Days__c);
	//             } else if (
	//               this.checklistLookupField !== "" &&
	//               this.checklistLookupField &&
	//               field.fieldName === this.checklistLookupField
	//             ) {
	//               field.value = this.recordId;
	//             }
	//           });
	//         }
	//         this.showSpinner = false;
	//       })
	//       .catch((err) => {
	//         console.log(JSON.stringify(err));
	//         this.showSpinner = false;
	//       });
	//   }
	// }

	async fetchTemplateFeilds(event) {
		event.stopPropagation();
		this.CheckListTemplateId = event.detail.recordId;
		if (event.detail.recordId && event.detail.recordId !== '') {
			this.showAddForm = false;
			this.showSpinner = true;
			this.showChecklistFields = true;

			const templateId = event.detail.recordId;
			await fetchTemplate({ recordId: templateId })
				.then((result) => {
					this.selectedTemplate = result;
					//alert('Result- '+JSON.stringify(result));
					//console.log('Result-*- ' + JSON.stringify(result));
					this.processTempItems();
					this.formData[this.checklistTemplate_Field?.fieldApiName] = this.CheckListTemplateId;
					this.formData[this.checklistTitle_Field?.fieldApiName] = result.Name ? result.Name : '';

					if (this.isMobile) {

						let isLockedField = this.templateIsLocked_Field?.fieldApiName;

						if (isLockedField && !isLockedField.startsWith('kt_checklist__')) {

							isLockedField = 'kt_checklist__' + isLockedField;

						}

						this.formData[this.is_Checklist_Locked_Field?.fieldApiName] = result[isLockedField] ? result[isLockedField] : false;

						let sequentialField = this.templateIsSequential_Field?.fieldApiName;
						if (sequentialField && !sequentialField.startsWith('kt_checklist__')) {
							sequentialField = 'kt_checklist__' + sequentialField;
						}
						this.formData[this.templateIsSequential_Field?.fieldApiName] = result[sequentialField] ? result[sequentialField] : false;


						let descriptionField = this.templateDescription_Field?.fieldApiName;

						let dueDaysField = this.templateDueDays_Field?.fieldApiName;


						if ((descriptionField && !descriptionField.startsWith('kt_checklist__')) ||

							(dueDaysField && !dueDaysField.startsWith('kt_checklist__'))) {

							descriptionField = 'kt_checklist__' + descriptionField;

							dueDaysField = 'kt_checklist__' + dueDaysField;

						}

						this.formData[this.description_Field?.fieldApiName] = result[descriptionField] ? result[descriptionField] : '';

						this.formData[this.dueDays_Field?.fieldApiName] = result[dueDaysField] ? result[dueDaysField] : '';

						this.pupulateDueDate(result[dueDaysField]);

					} else {

						this.formData[this.is_Checklist_Locked_Field?.fieldApiName] = result[this.templateIsLocked_Field?.fieldApiName] ? result[this.templateIsLocked_Field?.fieldApiName] : false;

						this.formData[this.description_Field?.fieldApiName] = result[this.templateDescription_Field?.fieldApiName] ? result[this.templateDescription_Field?.fieldApiName] : '';

						this.formData[this.dueDays_Field?.fieldApiName] = result[this.templateDueDays_Field?.fieldApiName] || result[this.templateDueDays_Field?.fieldApiName] === 0 ? result[this.templateDueDays_Field?.fieldApiName] : '';

						this.formData[this.is_Checklist_Sequential_Field?.fieldApiName] = result[this.templateIsSequential_Field?.fieldApiName] ? result[this.templateIsSequential_Field?.fieldApiName] : false;

						this.pupulateDueDate(result[this.templateDueDays_Field?.fieldApiName]);

					}

					//this.formData[this.description_Field?.fieldApiName] = result[this.templateDescription_Field?.fieldApiName] ? result[this.templateDescription_Field?.fieldApiName] : '';
					//this.formData[this.dueDays_Field?.fieldApiName] = result[this.templateDueDays_Field?.fieldApiName] || result[this.templateDueDays_Field?.fieldApiName] === 0 ? result[this.templateDueDays_Field?.fieldApiName] : '';



					//this.pupulateDueDate(result[this.templateDueDays_Field?.fieldApiName]);
					this.showSpinner = false;
				})
				.catch((err) => {
					this.showToast('Error', err?.body?.message, 'error');
					// this.showToast('Error', 'error', err?.body?.message);
					//console.log(JSON.stringify(err));
					this.showSpinner = false;

				});
		}
	}


	pupulateDueDate(dueDaysInput) {
		const dueDays = parseInt(dueDaysInput, 10);
		if (!isNaN(dueDays)) {
			const currentDate = new Date();
			currentDate.setDate(currentDate.getDate() + dueDays);
			this.addChecklistDueDate = currentDate.toISOString().slice(0, 10);
		} else {
			this.addChecklistDueDate = undefined;
		}
	}

	handleDueDays(event) {
		const val = event.target.value?.trim()?.replaceAll(/[^\d]/g, '');
		if (val && val.length > 4) {
			event.target.value = val.substring(0, 4);
		} else {
			event.target.value = val;
		}

		this.formData[this.dueDays_Field?.fieldApiName] = val.substring(0, 4);
		this.pupulateDueDate(val.substring(0, 4));
	}

	handleInputChange(event) {
		let val;
		if (event.target?.name === 'togglevalue1') {
			val = event.target.checked;
		} else {
			val = event.target.value.trim();
		}
		let field = event.target.dataset.fieldname;
		this.formData[field] = val;
	}

	handleAssignToChange(event) {
		this.selectedAssignTo = event.detail.value;
		this.formData[this.assignTo_Field.fieldApiName] = event.detail.value;
		this.CheckListOwnerId = undefined;
	}

	handleRecordPickerChange(event) {
		this.CheckListOwnerId = event.detail.recordId;
		// if(this.showQueueLookup || this.showUserLookup){
		//   this.formData['OwnerId'] = this.CheckListOwnerId;
		// }
	}

	// handleKeyPress(event) {
	//   if (event.keyCode === 13) {
	//     event.preventDefault();
	//     event.target.blur();
	//   }
	// }

	handleSubmitButton() {
		try {
			this.showSpinner = true;
			// this.isSubmittedFromSaveAction = true;
			// this.template.querySelector("lightning-record-edit-form")?.submit();

			if (!this.handleCheckValidity()) {
				let checklistTitleElement = this.template.querySelector(
					`[data-fieldname="${this.checklistTitle_Field?.fieldApiName}"]`);
				checklistTitleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

				this.showSpinner = false;
				return;
			} else if (!this.tempChecklistItems || this.tempChecklistItems.length < 1) {
				this.showToast(
					'Error',
					'At least one Checklist Item is required to create a Checklist.',
					'error'
				);
				this.showSpinner = false;
				return;
			}

			if (this.CheckListOwnerId && this.CheckListOwnerId !== '') {
				this.formData.OwnerId = this.CheckListOwnerId;
			}
			this.checklistTemporaryData = this.formData;
			this.saveAddedItems();
		} catch (error) {
			console.log('error = ', error);
		}

	}

	// handleSubmitChecklist(event) {
	//   event.preventDefault();
	//   if (!this.isSubmittedFromSaveAction) {
	//     return;
	//   }

	//   if (event.key === "Enter") {
	//     return;
	//   }

	//   this.showSpinner = true;
	//   let checklistTitleElement = this.template.querySelector(
	//     `[data-fieldname="${this.checklistTitle_Field?.fieldApiName}"]`
	//   );
	//   let checklistdueDaysElement = this.template.querySelector(
	//     `[data-fieldname="${this.dueDays_Field?.fieldApiName}"]`
	//   );

	//   if (!this.handleCheckValidity()) {
	//     this.showSpinner = false;
	//     checklistTitleElement.scrollIntoView({
	//       behavior: "smooth",
	//       block: "center"
	//     });
	//     // this.showToast('Error', 'Please fill in all required fields', 'error');
	//     return;
	//   } else if (!this.tempChecklistItems || this.tempChecklistItems.length < 1) {
	//     this.showToast(
	//       "Error",
	//       "Required atleast one Checklist Item to create Checklist.",
	//       "error"
	//     );
	//     this.showSpinner = false;
	//     return;
	//   }

	//   const fields = event.detail.fields;

	//   if (checklistTitleElement) {
	//     fields[this.checklistTitle_Field.fieldApiName] =
	//       checklistTitleElement.value;
	//   }

	//   if (checklistdueDaysElement) {
	//     fields[this.dueDays_Field.fieldApiName] = checklistdueDaysElement.value;
	//   }

	//   if (this.CheckListOwnerId && this.CheckListOwnerId !== "") {
	//     fields.OwnerId = this.CheckListOwnerId;
	//   }

	//   if (
	//     this.selectedTemplate &&
	//     this.selectedTemplate[this.templateIsLocked_Field.fieldApiName]
	//   ) {
	//     fields[this.is_Checklist_Locked_Field.fieldApiName] =
	//       this.selectedTemplate[this.templateIsLocked_Field.fieldApiName];
	//   }

	//   if (this.CheckListTemplateId && this.CheckListTemplateId !== "") {
	//     fields[this.checklistTemplate_Field.fieldApiName] =
	//       this.CheckListTemplateId;
	//   }

	//   this.checklistTemporaryData = fields;
	//   this.saveAddedItems();
	// }

	@track tempChecklistItems;
	checklistTemporaryData;
	get showAddItems() {
		return this.tempChecklistItems && this.tempChecklistItems.length > 0;
	}

	@track showAddForm = false;

	handleAddItem(event) {
		event.preventDefault();
		this.showAddForm = true;
		// Set a timeout to scroll to the .btn-save element after a delay
		// setTimeout(() => {
		// const targetDiv = this.template.querySelector(".btn-save");
		// if (targetDiv) {
		//   targetDiv.scrollIntoView({ behavior: "smooth", block: "center" });
		// }
		// }, 50);
	}

	handleAddSave(event) {
		event.stopPropagation();
		event.preventDefault();
		this.showAddForm = false;
		let addedItem = event.detail;

		let AddedItems = this.tempChecklistItems
			? this.tempChecklistItems.length
			: 0;
		let TempItemsCount = this.selectedTemplate
			?.kt_checklist__Checklist_Template_Items__r
			? this.selectedTemplate.kt_checklist__Checklist_Template_Items__r.length
			: 0;
		let tempIndex = AddedItems - TempItemsCount;

		let item = {};
		item.Id = 'Temporary-' + tempIndex;

		//item.kt_checklist__Item__c = addedItem.kt_checklist__Item__c;
		//item.Item_Order__c = currentItem.Item_Order__c;

		//Commented the following and added next 2 lines on 2024.12.04
		// if (this.isMobile) {
		// 	item.kt_checklist__Item__c = addedItem.kt_checklist__Item__c;
		// 	item.kt_checklist__Description__c = addedItem.kt_checklist__Description__c;
		// } else {
		// 	item.kt_checklist__Item__c = addedItem.kt_checklist__Item__c;
		// 	item.kt_checklist__Description__c = addedItem.kt_checklist__Description__c;
		// }
		
		item.kt_checklist__Item__c = addedItem.kt_checklist__Item__c;
		item.kt_checklist__Description__c = addedItem.kt_checklist__Description__c;
		
		item.kt_checklist__Checklist__c = '';
		item.isTemplateItem = false;
		if (this.tempChecklistItems) {
			this.tempChecklistItems.push(item);
		} else {
			this.tempChecklistItems = [];
			this.tempChecklistItems.push(item);
		}
	}

	handleAddCancel() {
		this.showAddForm = false;
	}

	processTempItems() {
		let items = [];
		if (this.selectedTemplate) {
			//fetchTemplateItems and show the items
			if (
				this.selectedTemplate.kt_checklist__Checklist_Template_Items__r &&
				this.selectedTemplate.kt_checklist__Checklist_Template_Items__r.length >
				0
			) {
				this.selectedTemplate?.kt_checklist__Checklist_Template_Items__r?.forEach(
					(currentItem, index) => {
						var item = {};
						item.Id = 'Default-' + index;
						item.kt_checklist__Item__c = currentItem.kt_checklist__Item__c;
						item.kt_checklist__Item_Order__c =
							currentItem.kt_checklist__Item_Order__c;
						item.kt_checklist__Description__c =
							currentItem.kt_checklist__Description__c;
						item.kt_checklist__Checklist__c = '';
						item.isTemplateItem = true;
						items.push(item);
					}
				);
			}

			let tempIndex = 0;
			this.tempChecklistItems?.forEach((currentItem) => {
				let item = {};
				if (
					!this.selectedTemplate.kt_checklist__IsLocked__c &&
					!currentItem.isTemplateItem
				) {
					item.Id = 'Temporary-' + tempIndex;
					item.kt_checklist__Item__c = currentItem.kt_checklist__Item__c;
					//item.Item_Order__c = currentItem.Item_Order__c;
					item.kt_checklist__Description__c =
						currentItem.kt_checklist__Description__c;
					item.kt_checklist__Checklist__c = '';
					item.isTemplateItem = false;
					items.push(item);
					tempIndex++;
				}
			});

			this.tempChecklistItems = items;
		} else {
			let tempIndex = 0;
			this.tempChecklistItems?.forEach((currentItem) => {
				let item = {};
				if (!currentItem.isTemplateItem) {
					item.Id = 'Temporary-' + tempIndex;
					item.kt_checklist__Item__c = currentItem.kt_checklist__Item__c;
					//item.Item_Order__c = currentItem.Item_Order__c;
					item.kt_checklist__Description__c =
						currentItem.kt_checklist__Description__c;
					item.kt_checklist__Checklist__c = '';
					item.isTemplateItem = false;
					items.push(item);
					tempIndex++;
				}
			});

			this.tempChecklistItems = items;
		}
	}

	handleCheckValidity() {
		let isValid = true;
		const allValid = [
			...this.template.querySelectorAll('lightning-record-picker'),
			...this.template.querySelectorAll('lightning-input'),
			...this.template.querySelectorAll('lightning-textarea'),
			...this.template.querySelectorAll('lightning-combobox')
		].reduce((validSoFar, inputCmp) => {
			//getting error i.e t?.value?.trim is not a function that's why added check
			//inputCmp.value = inputCmp?.value?.trim();
			if (typeof inputCmp.value === 'string') {
				inputCmp.value = inputCmp.value.trim();
			}
			inputCmp.reportValidity();
			return validSoFar && inputCmp.checkValidity();
		}, true);
		if (allValid) {
			isValid = true;
		} else {
			isValid = false;
		}

		return isValid;
	}

	handleItemAudit(event) {
		if (event.target.value.trim() === '') {
			this.handleClearAddItem(event);
			// event.target.value = this.tempChecklistItems.find(item => item.Id === event.target.dataset.id)?.kt_checklist__Item__c;
		} else {
			this.tempChecklistItems = this.tempChecklistItems.map((item) => {
				if (item.Id === event.target.dataset.id) {
					item.kt_checklist__Item__c = event.target.value;
				}
				return item;
			});
		}
	}

	handleClearAddItem(event) {
		event.preventDefault();
		let tempIndex = event.currentTarget.dataset.itemindex;
		// this.tempChecklistItems.push(item);
		this.tempChecklistItems.splice(tempIndex, 1);
		this.processTempItems();
	}

	saveAddedItems() {
		var items = [];
		this.tempChecklistItems?.forEach((currentItem, index) => {
			var item = {};
			var tempIndex = index;
			if (
				((this.templateType === 'With Template' &&
					this.selectedTemplate &&
					!this.selectedTemplate.kt_checklist__IsLocked__c) ||
					this.templateType !== 'With Template') &&
				!currentItem.isTemplateItem
			) {
				item.kt_checklist__Item__c = currentItem.kt_checklist__Item__c;
				//item.Item_Order__c = currentItem.Item_Order__c;
				item.kt_checklist__Description__c = currentItem.kt_checklist__Description__c;
				item.kt_checklist__Item_Order__c = tempIndex + 1;
				items.push(item);
			}
		});

		if (this.isMobile) {
			const newChecklistData = {};
			const prefix = 'kt_checklist__';
			Object.keys(this.checklistTemporaryData).forEach(key => {
				if (key.startsWith(prefix)) {
					newChecklistData[key] = this.checklistTemporaryData[key];
				} else if (key != 'OwnerId') {
					newChecklistData[prefix + key] = this.checklistTemporaryData[key];
				} else {
					newChecklistData[key] = this.checklistTemporaryData[key];
				}
			});
			this.checklistTemporaryData = newChecklistData;
		}

		saveChecklistAndItems({
			recordId : this.recordId,
			Items: JSON.stringify(items),
			ChecklistRecord: [this.checklistTemporaryData]
		})
			.then((result) => {
				this.showSpinner = false;

				if (FORM_FACTOR === 'Small' || FORM_FACTOR === 'Medium') {
					this[NavigationMixin.Navigate]({
						type: 'standard__recordPage',
						attributes: {
							recordId: this.recordId,
							actionName: 'view'
						}
					});
				} else {
					const selectedEvent = new CustomEvent('addnewchecklistsuccess', {
						detail: { checklist: result, title: this.checklistTemporaryData[this.checklistTitle_Field?.fieldApiName] }
					});
					this.dispatchEvent(selectedEvent);
				}
			})
			.catch((err) => {
				//console.log('Error while saving the checklist and items ' + JSON.stringify(err));

				this.showToast('Error', err?.body?.message, 'error');
				this.showSpinner = false;
			});
	}

	closeModal() {
		if (FORM_FACTOR === 'Small' || FORM_FACTOR === 'Medium') {
			this[NavigationMixin.Navigate]({
				type: 'standard__recordPage',
				attributes: {
					recordId: this.recordId,
					actionName: 'view'
				}
			});
		} else {
			const selectedEvent = new CustomEvent('close', { detail: true });
			this.dispatchEvent(selectedEvent);
		}
		// this.showmodal = false;
	}

	async handleChangeChecklistType(event) {
		let changeType = this.templateType === 'With Template' ? 'Without Template' : 'With Template';


		if (this.showChecklistFields) {
			const result = await LightningConfirm.open({
				message: 'Any unsaved data will be lost. Are you sure you want to go back?', // `You are about to change the checklist type from '${this.templateType}' to '${changeType}'.`,
				theme: 'warning',
				label: 'Change Create Checklist Type',
			});
			if (result) {


				this.navigateToChecklistTypeSelectionScreen();
				// this.templateType = changeType;
				// this.showChecklistFields = this.templateType === 'With Template' ? false : true;

				// this.resetForm();
				// this.removeItems();

			}
		} else {
			this.navigateToChecklistTypeSelectionScreen();
		}
	}

	navigateToChecklistTypeSelectionScreen() {
		if (this.isMobile) {
			let componentDef = {
				componentDef: "kt_checklist:createChecklistDialog",
				attributes: {
					recordIdOfAcc: this.recordId,
					ShowAsPopUp: false
				}
			};
			//  console.log("inside handleCreateChecklist :: " + componentDef);
			let encodedComponentDef = btoa(JSON.stringify(componentDef));
			//   console.log("encodedComponentDef :: " + encodedComponentDef);
			this[NavigationMixin.Navigate]({
				type: "standard__webPage",
				attributes: {
					url: "/one/one.app#" + encodedComponentDef
				}
			});
		}
		const selectedEvent = new CustomEvent('back', { detail: true });
		this.dispatchEvent(selectedEvent);
	}

	//   resetForm(){
	// 	this.tempChecklistItems = [];
	// 	this.formData['kt_checklist__Checklist_Title__c'] = '';
	// 	this.formData['kt_checklist__Description__c'] = '';
	// 	this.formData['kt_checklist__Due_Days__c'] = '';
	// 	this.formData['kt_checklist__Assign_To__c'] = '';

	// 	this.addChecklistDueDate = undefined;
	// 	this.selectedAssignTo = '';
	//   }

	//   removeItems(){
	// 	if(this.templateType === 'With Template'){
	// 		this.tempChecklistItems = this.tempChecklistItems && this.tempChecklistItems.length > 0 ? this.tempChecklistItems.filter(currentItem => currentItem.isTemplateItem ) : [];
	// 	}else{
	// 		this.tempChecklistItems = [];
	// 	}
	//   }

	handleChecklistItemChange(event) {
		this.tempChecklistItems = event.detail.value;
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