import { LightningElement, api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class DescriptionDisplay extends LightningElement {
    @api flexipageRegionWidth;

    @api description = '';
    // @api maxLength =  50;

	showAction = false;
	isShowMoreClicked = false;
	get showLabel() {
		return this.isShowMoreClicked ? 'Show less' : 'Show more';
	}

	// get className(){
	// 	return this.showAction ? 'description-box' : '';
	// }
	descriptionClass = 'description-box';
	
	get maskClass(){
		return this.showAction && !this.isShowMoreClicked ? 'gradient-mask show-more' : 'show-more';
	}

	handleLabel() {
		this.isShowMoreClicked = !this.isShowMoreClicked;
		this.descriptionClass = this.isShowMoreClicked ? 'wordbreakClass' : 'description-box';
	}

	renderedCallback() {
		const r = this.refs.desc;
		r.innerHTML = this.description;

		// console.log(r.scrollHeight);
		// console.log(r.clientHeight);
		if (r && r.scrollHeight != r.clientHeight) {
			this.showAction = true;
			// this.descriptionClass = this.showAction ? 'description-box' : '';
		}else{
			// this.showAction = false;
		}
	}


	/*
     * Calculates the maximum length of the displayed description based on various factors.
     * @returns The maximum length of the displayed description.
	*/
	// get maxLength() {
	// 	if (FORM_FACTOR) {
	// 		if (FORM_FACTOR === 'Large') {
	// 			if (this.flexipageRegionWidth) {
	// 				return this.getMaxLength(this.flexipageRegionWidth, 100);
	// 			}
	// 			return 100;
                
	// 		}
	// 		return this.getMaxLength(FORM_FACTOR, 60);
            
            
	// 	} else if (this.flexipageRegionWidth) {
	// 		return this.getMaxLength(this.flexipageRegionWidth, 100);
	// 	}
	// 	return 100;
        
	// }

	/*
     * Calculates maximum length based on device size.
     * @param size - The size of the device.
     * @param lngth - The default length.
     * @returns The maximum length based on device size.
	*/
	// getMaxLength(size, lngth) {
	// 	if (size && size !== '') {
	// 		size = size.toLowerCase();
	// 		if (size === 'large') {
	// 			return lngth * 4;
	// 		} else if (size === 'medium') {
	// 			return lngth * 2.5;
	// 		} else if (size === 'small') {
	// 			return lngth;
	// 		}
	// 		return lngth;
            
	// 	}
	// 	return lngth;
        
	// }

	// displayedDescription;
	// showMoreLink = false;

	// get divClass() {
	// 	return this.description && this.description !== '' ? '' : 'slds-hide';
	// }

	// connectedCallback() {
		
	// 	// Display only the first 100 characters initially
	// 	this.displayedDescription = this.truncateDescription(this.description, this.maxLength);

	// 	// Show "..." link if the description is longer than 100 characters
	// 	if (this.description && this.description.length > this.maxLength) {
	// 		this.showMoreLink = true;
	// 	}
	// }

	/*
     * Truncates the description if it exceeds the maximum length.
     * @param text - The description text.
     * @param maxLength - The maximum length of the description.
     * @returns The truncated description.
	*/
	// truncateDescription(text, maxLength) {
	// 	if (!text || text.length <= maxLength) {
	// 		return text;
	// 	}

	// 	// Find the last space within the maxLength
	// 	let truncatedText = text.substr(0, maxLength);
	// 	const lastSpaceIndex = truncatedText.lastIndexOf(' ');

	// 	// Truncate at the last space within the maxLength
	// 	if (lastSpaceIndex !== -1) {
	// 		truncatedText = truncatedText.substr(0, lastSpaceIndex);
	// 	}

	// 	return truncatedText + '...';
	// }

	/*
     * Displays the full description when "..." link is clicked.
	*/
	// handleMoreInfo() {
	// 	// Display the full description when "..." link is clicked
	// 	this.displayedDescription = this.description;
	// 	this.showMoreLink = false;
	// 	this.showLessLink = true;
	// }

	/*
     * Displays the truncated description when "Less" link is clicked.
	*/
	// handleLessInfo() {
	// 	// Display the full description when "..." link is clicked
	// 	this.displayedDescription = this.truncateDescription(this.description, this.maxLength);
	// 	this.showMoreLink = true;
	// 	this.showLessLink = false;
	// }
	
}