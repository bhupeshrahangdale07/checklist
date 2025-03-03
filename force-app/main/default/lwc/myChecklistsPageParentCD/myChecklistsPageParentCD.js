/*
  *This component is added to the MyChecklist tab, and it redirects to either Desktop or Mobile specific component of MyChecklist.
*/
import { LightningElement,track,api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class ChecklistManagerParent extends LightningElement {
    //@track isDesktop = true; 

    //Uncomment this code when Mobile designs are continued developing
    @track isDesktop = false;
    @track isMobile = false;

    @api recordId;

    connectedCallback(){
        //console.log('FORM_FACTOR :: ' +FORM_FACTOR);
        //console.log('recordid ::' +this.recordId);
        if(FORM_FACTOR == 'Large'){
            this.isDesktop =true;
            //console.log('this.isDesktop :: ' +this.isDesktop);
        }
        if(FORM_FACTOR == 'Small' || FORM_FACTOR == 'Medium'){
            this.isMobile =true;
            //console.log('this.isMobile :: ' +this.isMobile);
        }
    }
}