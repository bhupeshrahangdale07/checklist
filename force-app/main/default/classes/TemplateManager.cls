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
    public static Map<String, Object> saveTemplateAndItems(String Template, List<Checklist_Template_Item__c> TemplateItems, List<Checklist_Template_Item__c> DeletedTemplateItems){
        system.debug('Template*- '+Template);
        Map<String, Object> response = new Map<String, Object>();
        Savepoint sp = Database.setSavepoint();
        try {
            
            Checklist_Template__c TemplateRecord = (Checklist_Template__c) JSON.deserialize(Template, Checklist_Template__c.class);
            
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
            
            if(!TemplateItems.isEmpty()){
                for(Checklist_Template_Item__c item : TemplateItems){
                    if(item.Checklist_Template__c == null){
                        item.Checklist_Template__c = TemplateRecord.Id;
                    }
                }
                
                /*FLSChecker.FLSCheckWrapper fl2 = new FLSChecker.FLSCheckWrapper();
                fl2 = FLSChecker.dmlUpsert(TemplateItems); 
                if(!fl2.isSuccess){
                    throw new AuraHandledException(fl2.message);
                }*/
                upsert as user TemplateItems;
            }
            
            if(!DeletedTemplateItems.isEmpty()){
                /*FLSChecker.FLSCheckWrapper fl3 = new FLSChecker.FLSCheckWrapper();
                fl3 = FLSChecker.dmlDelete(DeletedTemplateItems); 
                if(!fl3.isSuccess){
                    throw new AuraHandledException(fl3.message);
                }*/
                delete as user DeletedTemplateItems;
            }
            
            response.put('recordId', TemplateRecord.Id);
            response.put('Status', 'Success');
            return response;
        } catch(AuraHandledException e){
            Database.rollback(sp);
            throw e;
        } catch (Exception e) {
            Database.rollback(sp);
            system.debug('test '+ e.getLineNumber());
            throw new AuraHandledException(e.getMessage());
        }
    }
}