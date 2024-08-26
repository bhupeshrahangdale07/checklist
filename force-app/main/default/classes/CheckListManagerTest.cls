@isTest
public class CheckListManagerTest {
    @testSetup
    public static void setupData(){
        
        User u = new User(profileId=[Select id from Profile where Name='Standard User' Limit 1].Id, email='tt@ck.com',
                     username='tt@ck.com', alias='sd', firstName='test', LastName='User',
                    TimeZoneSidKey = 'Asia/Kolkata', LocaleSidKey = 'en_IN', EmailEncodingKey='UTF-8', LanguageLocaleKey='en_US' );
        insert u;
        
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
        
        Checklist_Item__c checkLI = new Checklist_Item__c();
        checkLI.Item__c = 'Test item 01';
        checkLI.Item_Order__c = 1;
        checkLI.Checklist__c = checkL.Id;
        insert checkLI;
        
    }
    
    @isTest
    public static void fetchCheckLists_Test(){
        Account acc = [Select id from Account limit 1];
        Test.startTest();
        List<Checklist__c> checklists = CheckListManager.fetchCheckLists(acc.Id);
        Test.stopTest();
        
        // Assert that at least one checklist is fetched
        System.assertNotEquals(0, checklists.size(), 'No checklists found for record');
    }
        
    @isTest
    public static void fetchTemplate_Test(){
        Checklist_Template__c ct = [Select id from Checklist_Template__c limit 1];
        Test.startTest();
        Checklist_Template__c fetchedTemplate = CheckListManager.fetchTemplate(ct.Id);
        Test.stopTest();
        
        System.assertEquals(ct.Id, fetchedTemplate.Id, 'Fetched template ID does not match');
    }
    
    @isTest
    public static void saveCheckListItems_Test(){
        Checklist_Item__c ci = [Select id from Checklist_Item__c limit 1];
        Test.startTest();
        CheckListManager.saveCheckListItems(ci.Id, 'Yes');
        
        // false test
        try{
            CheckListManager.saveChecklistAndItems(new List<Checklist__c>{new Checklist__c(Checklist_Title__c='test')}, '{Item__c="Test"}');
        }catch(exception e){
            system.debug('91 ---- '+e.getMessage());
        }
        
        CheckListManager.saveChecklistAndItems(new List<Checklist__c>{new Checklist__c(Checklist_Title__c='test')}, JSON.serialize(new List<Checklist_Item__c>{new Checklist_Item__c(Item__c='Test')}));
        Test.stopTest();
        
        Checklist_Item__c updatedItem = [SELECT Checked__c FROM Checklist_Item__c WHERE Id =: ci.Id];
        System.assertEquals('Yes', updatedItem.Checked__c, 'Checklist item was not marked as checked');
    }
    
    @isTest
    public static void getRelatedFieldNameByRecordId_Test(){
        Account acc = [Select id from Account limit 1];
        Test.startTest();
        Map<String, String> fieldMap = CheckListManager.getRelatedFieldNameByRecordId(acc.Id);
        Test.stopTest();
        
        System.assertNotEquals(0, fieldMap.size(), 'No related field information found');
    }
    
    @isTest
    public static void getRelationObjectFieldMap_Test(){
        Test.startTest();
        Map<String, String> fieldMap = CheckListManager.getRelationObjectFieldMap('Account');
        Test.stopTest();
        System.assertNotEquals(0, fieldMap.size(), 'No related field information found');
    }
    
    @isTest
    public static void CreateCheckList_Test(){
        
        Id accId = [Select id from Account Limit 1].Id;
        Id tempId = [Select id from Checklist_Template__c Limit 1].Id;
        CheckListManager.requestWrap wrap = new CheckListManager.requestWrap();
        wrap.recordIds = new List<Id>{accId};
            wrap.templateId = tempId;
        
        Test.startTest();
        List<CheckListManager.responseWrap> responseList = CheckListManager.CreateCheckList(new List<CheckListManager.requestWrap>{wrap});
        Test.stopTest();
        
        System.assertNotEquals(0, responseList.size(), 'No checklists created');
        System.assertNotEquals(0, responseList.get(0).checklistRecords.size(), 'Checklist record not found in response');
    }
    
    @isTest
    public static void updateItemsOrder_Test(){
        Checklist_Item__c ci = [Select id, Item_Order__c from Checklist_Item__c limit 1];
        Integer initialOrder = (Integer) ci.Item_Order__c;
        ci.Item_Order__c = ci.Item_Order__c + 1;
        
        Test.startTest();
        CheckListManager.updateItemsOrder(new List<Checklist_Item__c>{ci});
        Test.stopTest();
        
        // Query the updated Checklist_Item__c record to verify the order change
        Checklist_Item__c updatedItem = [SELECT Item_Order__c FROM Checklist_Item__c WHERE Id =: ci.Id];
        System.assertEquals(initialOrder + 1, updatedItem.Item_Order__c, 'Checklist item order was not updated');
        
    }
    
    @isTest
    public static void saveChecklistAndItems_Test(){
        Checklist__c checkL = [Select id from Checklist__c limit 1];
        
        Checklist_Item__c checkLI = new Checklist_Item__c();
        checkLI.Item__c = 'Test item 01';
        checkLI.Item_Order__c = 1;
        
        String jsonString = JSON.serialize(checkLI);
        
        Test.startTest();
        Checklist__c returnedChecklist = CheckListManager.createChecklistItem(jsonString, checkL.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, returnedChecklist, 'Checklist was not saved');
        System.assertNotEquals(0, returnedChecklist.Checklist_Items__r.size(), 'Checklist item was not added');
    }
    
    @isTest
    public static void testNoAccess(){
        // This code runs as the system user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce'];
        User u = new User(Alias = 'standt', Email='minmumAcc@testorg.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='minimumAcc@testorg.com');
            Checklist__c checkL = [Select id from Checklist__c limit 1];
        
        System.runAs(u) {
            
            
            Checklist_Item__c checkLI = new Checklist_Item__c();
            checkLI.Item__c = 'Test item 01';
            checkLI.Item_Order__c = 1;
            
            String jsonString = JSON.serialize(checkLI);
            
            try{
                Checklist__c returnedChecklist = CheckListManager.createChecklistItem(jsonString, checkL.Id);
            }catch(AuraHandledException e){
                System.assertEquals('Script-thrown exception', e.getMessage());                
            }
        }
    }
}