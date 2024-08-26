@isTest
public class CheckListTriggerTest {
    @isTest
    public static void checklistTriggerTestMethod(){
        
        Checklist_Template__c checkTemplate = new Checklist_Template__c();
        checkTemplate.Active__c = True;
        checkTemplate.Name = 'Test Template 1';
        checkTemplate.Description__c = 'Just a Test Template';
        checkTemplate.Due_Days__c = 6;
        checkTemplate.IsLocked__c = True;
        insert checkTemplate;
        
        Checklist_Template_Item__c checkItem = new Checklist_Template_Item__c();
        checkItem.Checklist_Template__c = checkTemplate.Id;
        checkItem.Item_Order__c = 1;
        checkItem.Item__c = 'test check point';
        checkItem.Description__c = 'test description';
        insert checkItem;
        
        Account acc = new Account();
        acc.Name = 'Test Acc';
        insert acc;
        
        Checklist__c checkL = new Checklist__c();
        checkL.Checklist_Template__c = checkTemplate.Id;
        checkL.Checklist_Title__c = checkTemplate.Name;
        //checkL.Account__c = acc.Id;
        insert checkL;
        
        List<Checklist__c> checklists = [SELECT Id FROM Checklist__c WHERE Id =: checkL.Id];
        System.assertNotEquals(0, checklists.size(), 'Checklist__c record not created by trigger');
        delete checkL;
    }
}