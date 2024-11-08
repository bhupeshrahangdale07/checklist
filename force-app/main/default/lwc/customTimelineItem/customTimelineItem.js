import { LightningElement, api, track } from 'lwc';

export default class CustomTimelineItem extends LightningElement {

    @api itemType = '';
    @api showLine = false;

    // @track iconVariant;


    get timelineTypeProperties(){
        let wrap = {};
        switch (this.itemType) {
            case "success":
            case "Yes":
            case true:
                wrap.timelinecss = this.showLine ? 'slds-timeline__item_expandable kt_checklist__success-class' : 'kt_checklist__success-class';
                wrap.iconVariant = 'success';
                wrap.iconName = 'utility:success';
                break;
            
            case "error":
            case "Not Applicable":
            case false:
                wrap.timelinecss = this.showLine ? 'slds-timeline__item_expandable kt_checklist__error-class' : 'kt_checklist__error-class';
                wrap.iconVariant = 'error';
                wrap.iconName = 'utility:error';
                break;

            default:
                wrap.timelinecss = this.showLine ? 'slds-timeline__item_expandable' : '';
                wrap.iconVariant = '';
                wrap.iconName = 'utility:routing_offline';
                break;
        }
        return wrap;
    }
}