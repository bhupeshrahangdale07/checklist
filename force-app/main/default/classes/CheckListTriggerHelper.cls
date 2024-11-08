/*
     * @description: Helper class for CheckListTriggerHandler class. 
     * Used for: Running the Aggregate query under "Without Sharing" class to get how many Checklists are created using 
     * particular Checklist Templates irrespective of the access permission and return it, 
     * later it will be updated in CheckListTriggerHandler class in the Template Used Count field.
     * Used for: creating Checklist Items In SystemMode to avoid Dml issue due to OWD private
     * Used for: updating Checklist Templates In System Mode to avoid Dml issue due to OWD
     * @Author: Kandisa Technologies
*/

public without sharing class CheckListTriggerHelper {
    /*
     * @description: To fetch Count of all the Checklists which are created using Checklist Templates irrespective of ownership
     * @return: List<AggregateResult>
     * @param: templateIds
    */ 
    public static List<AggregateResult> getChecklistTemplateAggregate(Set<Id> templateIds){
        return new List<AggregateResult>([SELECT Checklist_Template__c, COUNT(Id) recCount
                                                      FROM Checklist__c WHERE Checklist_Template__c IN: templateIds
                                                      WITH SYSTEM_MODE 
                                                      GROUP BY Checklist_Template__c ]);
    }
    
    
    /*
     * @description: To create Checklist Items In SystemMode to avoid Dml issue due to OWD private
     * @return: void
     * @param: checklistItems
    */ 
    public static void createChecklistItemsInSystemMode(List<Checklist_Item__c> checklistItems){
        insert as system checklistItems;
    }
    
    /*
     * @description: To update Checklist Templates In System Mode to avoid Dml issue due to OWD
     * @return: void
     * @param: checklistTemplates
    */ 
    public static void updateChecklistTemplatesInSystemMode(List<Checklist_Template__c> checklistTemplates){
        update as system checklistTemplates;
    }
    
}