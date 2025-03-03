trigger CheckListTrigger on Checklist__c (before insert, before update, after insert, after update, after delete) {

    if((Trigger.isInsert || Trigger.isUpdate) && Trigger.isBefore){
        //CheckListTriggerHandler.updateOwnerId(Trigger.New);
    }
    
        
    if(Trigger.isInsert && Trigger.isAfter){
        CheckListTriggerHandler.createChecklistItems(Trigger.New);
    }
    
    if(Trigger.isAfter && (Trigger.isInsert || Trigger.isUpdate )){
        system.debug('Trigger.isUpdate : ');
    	CheckListTriggerHandler.updateTemplateUsedCount(Trigger.New, Trigger.oldMap);
    }
    
    if(Trigger.isDelete && Trigger.isAfter){
        CheckListTriggerHandler.updateTemplateUsedCount(Trigger.old, null);
    }
}