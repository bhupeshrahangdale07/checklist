@isTest
public class MyChecklistsPageManagerTest {
    @testSetup
    public static void setupData(){
        Profile testProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User'];
        User testUser = new User(
            ProfileId = testProfile.Id,
            LastName = 'Test',
            FirstName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuserChecklist@example.com',
            Alias = 'tuser',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/Los_Angeles'
        );
        insert testUser;
        
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
        
        Checklist__c checkL = new Checklist__c();
        checkL.Checklist_Template__c = checkTemplate.Id;
        checkL.Checklist_Title__c = checkTemplate.Name;
        checkL.OwnerId = testUser.Id;
        insert checkL;
    }
    
    @isTest
    public static void myChecklistPageManagerTestMethod(){
        User usr = [SELECT id FROM User Where Email = 'testuser@example.com' Limit 1];
        Test.startTest();
            List<Checklist__c> returnedChecklists = MyChecklistsPageManager.fetchCheckLists(usr.id);
        Test.stopTest();
        
        System.assertNotEquals(0, returnedChecklists.size(), 'No checklists returned for the user');
    }
        
    @isTest
    public static void getRelationObjectIconFieldMapMethod(){
        Test.startTest();
            Map<String, String> relationshipFields = MyChecklistsPageManager.getRelationObjectIconFieldMap('Account');
        Test.stopTest();
        System.assertNotEquals(0, relationshipFields.size(), 'No relationship fields found');
    }
}