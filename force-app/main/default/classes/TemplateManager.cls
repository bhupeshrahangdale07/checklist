/*
     * @description: Controller class for LWC of Checklist Templates. To create and edit the Checklist Templates records
     * @Author: Kandisa Technologies
*/

public with sharing class TemplateManager {
    /*
     * @description: To fetch Checklist Template and it's Items when the View/Edit custom Lwc page of Checklist Templates object loads
     * @return: Checklist_Template__c
     * @param: recordId
    */    
    @AuraEnabled
    public static Checklist_Template__c getTemplateItems(String recordId){
        try {
            return [Select Id, Name, Due_Days__c, Active__c, IsLocked__c, Sequential__c, CreatedById, LastModifiedById, CreatedDate, LastModifiedDate, (Select Id, Item_Order__c, Item__c, Description__c From Checklist_Template_Items__r order by Item_Order__c ASC ) From Checklist_Template__c Where Id =: recordId WITH USER_MODE];
        } catch(QueryException  e){
            system.debug('test Exception '+e.getmessage());
            throw new AuraHandledException('Fetching Checklist Template Or Template Items Failed : '+e.getmessage());
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    /*
     * @description: To save Checklist Template and Items and it's Items when the View/Edit custom Lwc page of Checklist Templates object loads
     * @return: Map<String, Object>
     * @param: Template, TemplateItems, DeletedTemplateItems
    */
    @AuraEnabled
    public static Map<String, Object> saveTemplateAndItems(String Template, List<Checklist_Template_Item__c> TemplateItems,
                                                        List<Checklist_Template_Item__c> DeletedTemplateItems,
                                                        Boolean updateRelatedOpenChecklist){

        Map<String, Object> response = new Map<String, Object>();
        try {
            
            system.debug('updateRelatedOpenChecklist : '+updateRelatedOpenChecklist);
            Checklist_Template__c TemplateRecord = (Checklist_Template__c) JSON.deserialize(Template, Checklist_Template__c.class);
            
            Map<Id, Checklist_Template_Item__c> oldMap;
            Checklist_Template__c oldTemp;
            if(TemplateRecord.Id != null){
                oldTemp = [Select id, Template_Used_Count__c from Checklist_Template__c where id =:TemplateRecord.Id WITH USER_MODE];
                oldMap = new Map<Id, Checklist_Template_Item__c>([Select Id, Item_Order__c, Item__c, Description__c From Checklist_Template_Item__c where Checklist_Template__c =:TemplateRecord.Id]);
            }
            
            
            List<Checklist_Template__c> lstTemplateRecord = new List<Checklist_Template__c>{TemplateRecord};
            if(lstTemplateRecord != null){
                system.debug('lstTemplateRecord- '+lstTemplateRecord);
                /*FLSChecker.FLSCheckWrapper fl = new FLSChecker.FLSCheckWrapper();
                fl = FLSChecker.dmlUpsert(lstTemplateRecord); 
                if(!fl.isSuccess){
                    throw new AuraHandledException(fl.message);
                }*/
                upsert as user lstTemplateRecord;
            }
        
            List<Checklist_Template_Item__c> updatedItems = new List<Checklist_Template_Item__c>();
            List<Checklist_Template_Item__c> updatedItemsforChecklists = new List<Checklist_Template_Item__c>();
            List<Checklist_Template_Item__c> insertedItems = new List<Checklist_Template_Item__c>();	
            
            if(!TemplateItems.isEmpty()){
                for(Checklist_Template_Item__c item : TemplateItems){

                    if(item.Checklist_Template__c == null){
                        item.Checklist_Template__c = TemplateRecord.Id;
                    }
                    
                    
                    if(item.Id == null){
                        updatedItems.add(item);
                    }else if(item.Id != null && oldMap != null && oldMap.containsKey(item.Id) && isItemUpdated(item, oldMap.get(item.Id)) ){
                        updatedItems.add(item);
                        /*if(updateRelatedOpenChecklist){
                            updatedItemsforChecklists.add(item);
                        } */
                    }else if(item.Id != null && oldMap != null && oldMap.containsKey(item.Id) && isItemOrderUpdated(item, oldMap.get(item.Id)) ){
                        updatedItems.add(item);
                    }
                    
                    
                }
                
                if(!updatedItems.isEmpty()){
                     /// update as user updatedItems; 
                        
                    Database.UpsertResult[] results = Database.upsert(updatedItems, AccessLevel.USER_MODE);
                    // if(updateRelatedOpenChecklist){
                        for(Integer index = 0, size = results.size(); index < size; index++) {
                            if(results[index].isCreated()){
                                insertedItems.add(updatedItems[index]);
                            }
                        }
                    // }
                }

            }
            
            if(!DeletedTemplateItems.isEmpty()){
                /*FLSChecker.FLSCheckWrapper fl3 = new FLSChecker.FLSCheckWrapper();
                fl3 = FLSChecker.dmlDelete(DeletedTemplateItems); 
                if(!fl3.isSuccess){
                    throw new AuraHandledException(fl3.message);
                }*/
                
                // database.executeBatch(new ChecklistItemsBatch(TemplateRecord, insertedItems, prepareMap(updatedItemsforChecklists), prepareMap(DeletedTemplateItems)), 1);
                delete as user DeletedTemplateItems;
            }
            
            // TemplateManagerWithoutSharing.createChecklistItems(TemplateRecord, insertedItems, new Map<Id, Checklist_Template_Item__c>(updatedItemsforChecklists), null);
            
            if(updateRelatedOpenChecklist){
                AggregateResult ag = [Select Count(Id) recordsCount From Checklist__c Where Checklist_Template__c = :TemplateRecord.Id AND Percentage_Completion__c < 100 WITH USER_MODE];
                Integer recordsCount = 0;
                if(ag.get('recordsCount') != null){
                    recordsCount = Integer.valueOf(ag.get('recordsCount'));
                }

                if(recordsCount > 5000){
                    database.executeBatch(new ChecklistItemsBatch(TemplateRecord, insertedItems), 2000);
                }else{
                    ChecklistItemsBatch.createChecklistItems([Select Id, Checklist_Item_Count__c, Checklist_Title__c, Percentage_Completion__c, Checklist_Template__c From Checklist__c Where Checklist_Template__c =:TemplateRecord.Id AND Percentage_Completion__c < 100 WITH USER_MODE ], insertedItems);
                }
            }
            
            response.put('recordId', TemplateRecord.Id);
            response.put('Status', 'Success');
            return response;
        } catch(AuraHandledException e){
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public static Boolean isItemUpdated(Checklist_Template_Item__c newItem, Checklist_Template_Item__c oldItem){        
        if(newItem.Item__c != oldItem.Item__c ||
            newItem.Description__c != oldItem.Description__c){
            return true;
        }else{
            return false;
        }
    }
    
    public static Boolean isItemOrderUpdated(Checklist_Template_Item__c newItem, Checklist_Template_Item__c oldItem){        
        if(newItem.Item_Order__c != oldItem.Item_Order__c){
            return true;
        }else{
            return false;
        }
    }
    
    /*
    private static Map<Id, checklist_Template_Item__c> prepareMap(List<Checklist_Template_Item__c> updatedItems){
        Map<Id, checklist_Template_Item__c> recMap = new Map<Id, checklist_Template_Item__c>();
        if(updatedItems != null){
            recMap = new Map<Id, checklist_Template_Item__c>(updatedItems);
        }
        return recMap;   
    }*/
}