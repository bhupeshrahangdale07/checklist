public without sharing class ChecklistItemsBatch implements Database.Batchable<sObject>{
    public Checklist_Template__c template;
    public List<Checklist_Template_Item__c> insertedList;
    public ChecklistItemsBatch(Checklist_Template__c temp, List<Checklist_Template_Item__c> newList){
        template = temp;
        insertedList = newList;
        // updatedMap = updateMap;
        // deleteMap = deleteTempMap;        
    }
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        String templateId = template.id;
        return Database.getQueryLocator('Select Id, Checklist_Item_Count__c, Checklist_Title__c, Percentage_Completion__c, Checklist_Template__c From Checklist__c Where Checklist_Template__c =:templateId AND Percentage_Completion__c < 100 WITH SYSTEM_MODE');
    }

    public void execute(Database.BatchableContext bc, List<CheckList__c> checklists) {
        system.debug('Batch execute');
        
        createChecklistItems(checklists, insertedList);
    }

    public static void createChecklistItems(List<CheckList__c> checklists, List<Checklist_Template_Item__c> insertedList){
        List<Checklist_Item__c> items = new List<Checklist_Item__c>();
        for(CheckList__c checklist : checklists){
            items.addAll(fetchItemsToInsert(checklist, insertedList));
        }

        if(!items.isEmpty()){
            insert as system items;
        }  
    }

    private static List<CheckList_Item__c> fetchItemsToInsert(CheckList__c checklist, List<Checklist_Template_Item__c> tempItems){
        List<Checklist_Item__c> items = new List<Checklist_Item__c>();
        
        Integer itemsCount = (Integer) checklist.Checklist_Item_Count__c;
        for(Checklist_Template_Item__c tempItem : tempItems){
            Checklist_Item__c item = new Checklist_Item__c();
            item.Item__c = tempItem.Item__c;
            item.Item_Order__c = ++itemsCount;
            item.Description__c = tempItem.Description__c;
            item.Checklist__c = checklist.Id;
            
            item.Checklist_Template_Item__c = tempItem.Id;
            items.add(item);
        }
        return items;
    }
    
    public void finish(Database.BatchableContext bc) {
        
    }
    
    /*

    public Checklist_Template__c template;
    public List<Checklist_Template_Item__c> insertedList;
    public Map<Id, Checklist_Template_Item__c> updatedMap; 
    public Map<Id, Checklist_Template_Item__c> deleteMap;
    
    
    public ChecklistItemsBatch(Checklist_Template__c temp, List<Checklist_Template_Item__c> newList,
                            Map<Id, Checklist_Template_Item__c> updateMap, 
                            Map<Id, Checklist_Template_Item__c> deleteTempMap)
    {
        system.debug('Batch constructor');
        template = temp;
        insertedList = newList;
        updatedMap = updateMap;
        deleteMap = deleteTempMap;        
    }
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        system.debug('Batch start');
        system.debug('template : '+template);
        String templateId = template.id;
        system.debug('templateId : '+templateId);
        return Database.getQueryLocator('Select Id, Checklist_Item_Count__c, Checklist_Title__c, Percentage_Completion__c, Checklist_Template__c, (Select Id, Item__c, Item_Order__c, Description__c, Checklist__c, Checklist_Template_Item__c From CheckList_Items__r Where Checklist_Template_Item__c != null) From Checklist__c Where Checklist_Template__c =:templateId WITH SYSTEM_MODE');
    }

    public void execute(Database.BatchableContext bc, List<CheckList__c> checklists) {
        system.debug('Batch execute');
        createChecklistItems(checklists, insertedList, updatedMap, deleteMap);
    }
    
    public static void createChecklistItems(List<CheckList__c> checklists, List<Checklist_Template_Item__c> insertedList, Map<Id, Checklist_Template_Item__c> updatedMap, Map<Id, Checklist_Template_Item__c> deleteMap){
                
        List<CheckList_Item__c> upsertList = new List<CheckList_Item__c>();
        List<CheckList_Item__c> deleteList = new List<CheckList_Item__c>();
        
        system.debug('st : '+deleteMap);
        for(CheckList__c checklist : checklists){
                        
            List<CheckList_Item__c> items = fetchItemsToInsert(insertedList, checklist);
            if(!items.isEmpty()){
                upsertList.addAll(items);
            }
            
            for(CheckList_Item__c item : checklist.CheckList_Items__r){
                system.debug('item : '+item.Checklist_Template_Item__c);
                system.debug('item : '+deleteMap.keySet().contains(item.Checklist_Template_Item__c));
                if(deleteMap.keySet().contains(item.Checklist_Template_Item__c)){
                    system.debug('item : '+item);
                    deleteList.add(item);
                    continue;
                }
                
                if(updatedMap.containsKey(item.Checklist_Template_Item__c)){
                    upsertList.add(updateChecklistItemFields(updatedMap.get(item.Checklist_Template_Item__c), item));
                }
            }
        }

        if(!upsertList.isEmpty()){
            upsert as system upsertList;
        }
        
        if(!deleteList.isEmpty()){
            delete as system deleteList;
        } 
        
    }
    
    private static CheckList_Item__c updateChecklistItemFields(Checklist_Template_Item__c tempItem, CheckList_Item__c item){
        item.Item__c = tempItem.Item__c;
        item.Description__c = tempItem.Description__c;
        return item;
    }
    
    private static List<CheckList_Item__c> fetchItemsToInsert(List<Checklist_Template_Item__c> tempItems, CheckList__c checklist){
        List<Checklist_Item__c> items = new List<Checklist_Item__c>();
        
        Integer itemsCount = (Integer) checklist.Checklist_Item_Count__c;
        for(Checklist_Template_Item__c tempItem : tempItems){
            Checklist_Item__c item = new Checklist_Item__c();
            item.Item__c = tempItem.Item__c;
            item.Item_Order__c = ++itemsCount;
            item.Description__c = tempItem.Description__c;
            item.Checklist__c = checklist.Id;
            
            item.Checklist_Template_Item__c = tempItem.Id;
            items.add(item);
        }
        return items;
    }

    public void finish(Database.BatchableContext bc) {
        if(!deleteMap.isEmpty()) delete deleteMap.values();
        
    }
	*/
    
    
}