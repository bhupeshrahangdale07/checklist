/*
     * @description: Handler class for Checklist Trigger. Used to create and edit the Checklist Item records, Update Template Used Count when
     * a checklist is created, updated & deleted.
     * @Author: Kandisa Technologies
*/

public with sharing class CheckListTriggerHandler {
    
    public static Boolean runDMLInSystemMode = false;
    
    public static void createChecklistItems(List<Checklist__c> lstNewChecklists){        
        Set<Id> templateIds = new Set<Id>();
        for(Checklist__c check: lstNewChecklists){
            if(check.Checklist_Template__c != null){
                templateIds.add(check.Checklist_Template__c);
            }
        }
        
        Map<Id, Checklist_Template__c> checkListTemplates = new Map<Id, Checklist_Template__c>([Select id, Name, Active__c, isLocked__c, Description__c, 
                                                                                                (Select id, Item__c, Item_Order__c, Checklist_Template__c, Description__c from Checklist_Template_Items__r) 
                                                                                                From Checklist_Template__c Where Id IN: templateIds WITH USER_MODE]);
        
        List<Checklist_Item__c> items = new List<Checklist_Item__c>();
        for(Checklist__c check: lstNewChecklists){
            if(!checkListTemplates.containsKey(check.Checklist_Template__c)){
            continue;
            }
            for(Checklist_Template_Item__c tempItem: checkListTemplates.get(check.Checklist_Template__c).Checklist_Template_Items__r){
                Checklist_Item__c item = new Checklist_Item__c();
                item.Item__c = tempItem.Item__c;
                item.Item_Order__c = tempItem.Item_Order__c;
                item.Description__c = tempItem.Description__c;
                item.Checklist__c = check.Id;
                
                item.Checklist_Template_Item__c = tempItem.Id;
                items.add(item);
            }
        }

        if(!items.isEmpty()){
            /*FLSChecker.FLSCheckWrapper fl = new FLSChecker.FLSCheckWrapper();
            fl = FLSChecker.dmlInsert(items);
            
            if(!fl.isSuccess){
                DMLException d = new DMLException();
                d.setMessage(fl.message);
                throw d;
            }*/
            
            if(runDMLInSystemMode){
                CheckListTriggerHelper.createChecklistItemsInSystemMode(items);
            }else{
                insert as user items;
            }
        }
    }
    
    public static void updateTemplateUsedCount(List<Checklist__c> newChecklists, Map<Id, Checklist__c> oldChecklistMap){
        Map<Id, Checklist_Template__c> checkListTemp = new Map<Id, Checklist_Template__c>();
        
        for(Checklist__c check: newChecklists){
            if( (oldChecklistMap == null) || (oldChecklistMap != null && oldChecklistMap.containsKey(check.Id) && check.Checklist_Template__c != oldChecklistMap.get(check.Id).Checklist_Template__c )){
                
                if(check.Checklist_Template__c != null){
                    checkListTemp.put(check.Checklist_Template__c, new Checklist_Template__c(id = check.Checklist_Template__c, Template_Used_Count__c = 0));
                }
                if(oldChecklistMap != null && oldChecklistMap.get(check.Id).Checklist_Template__c != null){
                    checkListTemp.put(check.Checklist_Template__c, new Checklist_Template__c(id = check.Checklist_Template__c, Template_Used_Count__c = 0));
                }
            }
        }
        
        if(!checkListTemp.keySet().isEmpty()){
            List<AggregateResult> aggregateResults = CheckListTriggerHelper.getChecklistTemplateAggregate(checkListTemp.keySet());
                        
            if(!aggregateResults.isEmpty()){
                for(AggregateResult res: aggregateResults){
                    Id tempId = (Id) res.get('kt_checklist__Checklist_Template__c');
                    if(checkListTemp.containsKey(tempId)){
                        checkListTemp.get(tempId).Template_Used_Count__c = (Integer) res.get('recCount');
                    }else{
                        checkListTemp.put(tempId, new Checklist_Template__c(id = tempId, Template_Used_Count__c = (Integer) res.get('recCount')));
                    }
                }
            }
            
            
            
            if(!checkListTemp.values().isEmpty()){
                /*FLSChecker.FLSCheckWrapper fl = new FLSChecker.FLSCheckWrapper();
                fl = FLSChecker.dmlUpdate(lstCheckTemplatesToUpdate);
                if(!fl.isSuccess){
                    DMLException d = new DMLException();
                    d.setMessage(fl.message);
                    throw d;
                }*/
                 
                
                // Commented Below DML to allow update the Template count if any user creates a Checklist using a Template
                // update as user checkListTemp.values(); 
                if(runDMLInSystemMode){
                    CheckListTriggerHelper.updateChecklistTemplatesInSystemMode(checkListTemp.values());
                }else{
                    update as user checkListTemp.values(); 
                }
            }
        }
    }
    
}