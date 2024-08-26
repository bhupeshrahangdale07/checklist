@isTest
public class TemplateManagerTest {
    
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
    public static void getTemplateItems_Test(){
        Checklist_Template__c ct = [Select id from Checklist_Template__c limit 1];
        Test.startTest();
        Checklist_Template__c returnedTemplate = TemplateManager.getTemplateItems(ct.Id);
        Test.stopTest();
        
        System.assertEquals(true, returnedTemplate != null, 'No template returned by getTemplateItems');
        
        if (returnedTemplate != null) {
            System.assertEquals('Test Template 1', returnedTemplate.Name, 'Incorrect template name returned');
        }
    }
    
    @isTest
    public static void saveTemplateAndItems_Test(){
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
        Map<String, Object> response = TemplateManager.saveTemplateAndItems(JSON.serialize(ct), new List<Checklist_Template_Item__c>{ci1, ci2}, new List<Checklist_Template_Item__c>{ci});
        Test.stopTest();
        
        System.assertEquals('Success', response.get('Status'), 'saveTemplateAndItems did not return success');
        
    }
    
    @isTest
    public static void testNoAccess(){
        // This code runs as the system user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce'];
        User u = new User(Alias = 'standt', Email='minmumAcc@testorg.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='minimumAcc@testorg.com');

        Checklist_Template__c ct = [Select id from Checklist_Template__c limit 1];
        Checklist_Template_Item__c ci = [Select id, Description__c, Item__c, Item_Order__c, Checklist_Template__c from Checklist_Template_Item__c limit 1];
        
        Checklist_Template_Item__c ci1 = ci.clone();
        ci1.Item__c = 'ct1';
        ci1.Item_Order__c = 2;
        
        Checklist_Template_Item__c ci2 = ci.clone();
        ci1.Item__c = 'ct2';
        ci2.Item_Order__c = 3;
        ci2.Checklist_Template__c = null;
        
        System.runAs(u) {
            try{
                TemplateManager.getTemplateItems(ct.Id);
            }catch(AuraHandledException e){
                System.assertEquals('Script-thrown exception', e.getMessage());                
            }
            
            try{
                TemplateManager.saveTemplateAndItems(JSON.serialize(ct), new List<Checklist_Template_Item__c>{ci1, ci2}, new List<Checklist_Template_Item__c>{ci});
            }catch(AuraHandledException e){
                System.assertEquals('Script-thrown exception', e.getMessage());                
            }
        }
    }
}