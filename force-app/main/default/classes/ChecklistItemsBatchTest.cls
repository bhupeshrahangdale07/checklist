@isTest
public class ChecklistItemsBatchTest {
	
    @testSetup
    public static void setupData(){
        Checklist_Template__c checkTemplate = new Checklist_Template__c();
        checkTemplate.Active__c = True;
        checkTemplate.Name = 'Test Template 1';
        checkTemplate.Description__c = 'Just a Test Template';
        checkTemplate.Due_Days__c = 6;
        checkTemplate.IsLocked__c = True;
        
        insert checkTemplate;
        
        Checklist_Template_Item__c ci = new Checklist_Template_Item__c();
        ci.Checklist_Template__c = checkTemplate.Id;
        ci.Item_Order__c = 1;
        ci.Item__c = 'test Item__c';
        ci.Description__c = 'test Description__c';
        insert ci;
        
        
        Account acc = new Account();
        acc.Name = 'test';
        insert acc;
        
        Checklist__c checkL = new Checklist__c();
        checkL.Checklist_Template__c = checkTemplate.Id;
        checkL.Checklist_Title__c = checkTemplate.Name;
        checkL.Account__c = acc.Id;
        insert checkL;
    }
        
    @isTest
    public static void ChecklistItemsBatch_Test(){
        Checklist_Template__c ct = [Select id from Checklist_Template__c limit 1];
        Checklist_Template_Item__c ci = [Select id, Description__c, Item__c, Item_Order__c, Checklist_Template__c from Checklist_Template_Item__c limit 1];
        
        Checklist_Template_Item__c ci1 = ci.clone();
        ci1.Item__c = 'ct1';
        ci1.Item_Order__c = 2;
        
        Checklist_Template_Item__c ci2 = ci.clone();
        ci1.Item__c = 'ct2';
        ci2.Item_Order__c = 3;
        ci2.Checklist_Template__c = null;
        
        Test.startTest();        
        database.executeBatch(new ChecklistItemsBatch(ct, new List<Checklist_Template_Item__c>{ci1, ci2}), 2000);
        Test.stopTest();
                
    }
}