import { LightningElement,api,track } from "lwc";
import FORM_FACTOR from "@salesforce/client/formFactor";
export default class ModalPopUp extends LightningElement {
    
    @api showModal;
    @api enableHeader;
    @api headerTagline;
    @api header;
    @track isMobile = false;

    connectedCallback() {
    	if(FORM_FACTOR === "Small" || FORM_FACTOR === "Medium"){
    		this.isMobile =true;
    	}
    }

    handleClose() {
    	this.dispatchEvent(new CustomEvent("close"));
    }

}