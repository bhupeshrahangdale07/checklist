import { LightningElement, api,track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { NavigationMixin } from 'lightning/navigation';

export default class CreateChecklistDialog extends NavigationMixin(LightningElement) {
    @api showAsPopUp = false;
    @track isMobile =false;
    @api recordIdOfAcc;
    
    connectedCallback() {
    	if(FORM_FACTOR === 'Small'){
    		this.isMobile =true;
    	}
    }
    renderedCallback(){
		// if(FORM_FACTOR === 'Small'){
		// 	const style = document.createElement('style');
		// 		style.innerText = `div {
		// 			background-color: #fff !Important;
		// 			}
		// 	`;
		// 	this.template.querySelector('div')?.appendChild(style);
		// }
		
	}
    handleButton(event) {
    	var btnName = event.currentTarget.name;
    	if(FORM_FACTOR === 'Small'){
			/* Uncomment this when Mobile version is to be released.*/
    		event.preventDefault();
    		let componentDef = {
    			componentDef: 'c:createChecklistDuc',
    			attributes: {
    				recordId: this.recordIdOfAcc,
    				templateType: btnName
    			}
    		};
    		let encodedComponentDef = btoa(JSON.stringify(componentDef));
    		this[NavigationMixin.Navigate]({
    			type: 'standard__webPage',
    			attributes: {
    				url: '/one/one.app#' + encodedComponentDef
    			}
    		});
			
    	}
    	else{
    		const selectedEvent = new CustomEvent('selected', { detail: btnName });
    		this.dispatchEvent(selectedEvent);
    	}
    }

}