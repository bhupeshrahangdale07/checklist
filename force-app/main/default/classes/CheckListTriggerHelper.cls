/*
     * @description: Helper class for CheckListTriggerHandler class. Used to run the Aggregate query under "Without Sharing" class
     * to get how many Checklists are created using particular Checklist Templates irrespective of the access permission and return it, 
     * later it will be updated in CheckListTriggerHandler class in the Template Used Count field.
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
}