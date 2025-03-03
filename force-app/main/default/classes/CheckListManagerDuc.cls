/*
     * @description: Controller class for LWC Checklist Index and its child components. Used to create and edit the Checklist records,
     * fetch checklists, fetch templates, update items order, get related object field. 
     * @Author: Kandisa Technologies
*/

global with sharing class CheckListManagerDuc {
    // private static final List<String> specialObjects = new List<String>{'TASK', 'EVENT'};

    @InvocableMethod(label='Create CheckList' description='Create CheckList Record' category='Checklist__c')
    global Static List<responseWrap> CreateCheckList(List<requestWrap> request) {
        List<responseWrap> responseList = new List<responseWrap>();
        responseWrap response = new responseWrap();
        response.checklistRecords = new List<Checklist__c>();
        
        List<Checklist__c> CheckLists = new List<Checklist__c>();
        
        try{
            List<Id> recordIds = request[0].recordIds;
            String CheckListTemplateId = request[0].templateId;
            Checklist_Template__c checkListTemplates = [Select id, Name, Active__c, Due_Days__c, Sequential__c, CreatedDate, isLocked__c, Description__c,
                                                        (Select id, Item__c, Item_Order__c from Checklist_Template_Items__r) 
                                                        From Checklist_Template__c Where Id = :CheckListTemplateId WITH USER_MODE];
            
            
            for(String recordId : recordIds){    
                Checklist__c CheckList = new Checklist__c();
                CheckList.Checklist_Template__c = checkListTemplates.Id;
                CheckList.Checklist_Title__c = checkListTemplates.Name;
                
                CheckList.Description__c = checkListTemplates.Description__c;
                CheckList.Due_Days__c = checkListTemplates.Due_Days__c;
                CheckList.Is_Checklist_Locked__c = checkListTemplates.isLocked__c;
                CheckList.Sequential__c = checkListTemplates.Sequential__c;
                    
                Id sfId = (Id) recordId;
                // String objName = sfId.getSObjectType().getDescribe().getName();
                // if(objName.right(3) != '__c'){
                //     objName += '__c';
                // }
                String objFieldName = getRelatedFieldApiNameByRecordId(sfId);
                
                if(String.isBlank(objFieldName)){
                    //throw new AuraHandledException('Their is no Relationship between '+sfId.getSObjectType().getDescribe().getName()+'and Checklist');
                }else{
                    CheckList.put(objFieldName, recordId);
                    CheckLists.add(CheckList);
                }
                
            }
            
            response.checklistRecords = CheckLists;
            responseList.add(response);
            return responseList;
        }catch(Exception e){
            return responseList;
        }
    }
    
    global class requestWrap{
        @InvocableVariable(label='Record Ids' description='Related to RecordIds' required='true')
        global List<Id> recordIds;
        @InvocableVariable(label='Template Id' description='Template Id' required='true')
        global string templateId;
    }
    
    global class responseWrap{
        @InvocableVariable(label='Checklist Records' description='Checklist records')
        global List<Checklist__c> checklistRecords;
    }
    
    
    /*
     * Retrieves a map indicating whether the logged-in user has been assigned specific permission sets.
     * 
     * @return Map<String, Boolean> - A map with keys:
     *     - 'isStandard': true if the user has 'Checklist_Genius_Standard_User_Permissions' assigned, false otherwise.
     *     - 'isAdmin': true if the user has 'Checklist_Genius_Admin_Manager_Permissions' assigned, false otherwise.
     * 
     * The method checks for these permission sets based on the logged-in user's ID.
     */
    @AuraEnabled (cacheable = true)
    public Static Map<String, Boolean> assignedPermissions(){
        Map<String, Boolean> permissions = new Map<String, Boolean>{'isStandard' => false, 'isAdmin' => false };
        for(PermissionSetAssignment psa : [
            SELECT PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :UserInfo.getUserId()
            AND PermissionSet.Name IN ('Checklist_Genius_Standard_User_Permissions', 'Checklist_Genius_Admin_Manager_Permissions', 'Checklist_Genius_Standard_User_Permissions_Community')
            WITH SYSTEM_MODE
        ])
        {
            if(psa.PermissionSet.Name == 'Checklist_Genius_Standard_User_Permissions' ){
                permissions.put('isStandard', true);
            }
            
            if(psa.PermissionSet.Name == 'Checklist_Genius_Admin_Manager_Permissions' ){
                permissions.put('isAdmin', true);
            }
            
            if(psa.PermissionSet.Name == 'Checklist_Genius_Standard_User_Permissions_Community' ){
                permissions.put('isCommunity', true);
            }
        
        }
        
        return permissions;
    }
        
    
    /*
     * @param recordId is the any sobject id
     * returns the List of checklists with Items linked with the recordId.
    */
    @AuraEnabled
    public Static List<Checklist__c> fetchCheckLists(String recordId){
        /*
        if(!FLSChecker.isQueryAccessAvailable(new Checklist__c())){
            throw new AuraHandledException('Insufficient permissions : Object Checklist');
        }else if(!FLSChecker.isQueryAccessAvailable(new Checklist_Item__c())){
            throw new AuraHandledException('Insufficient permissions : Object Checklist Item');
        }*/
        
        SObject obj1 = new Checklist__c();
        SObject obj2 = new Checklist_Item__c();
        SObjectType myType1 = obj1.getSObjectType();
        SObjectType myType2 = obj2.getSObjectType();
        
        if(!myType1.getDescribe().isAccessible()){
            throw new AuraHandledException('Insufficient permissions : Object Checklist');
        }else if(!myType2.getDescribe().isAccessible()){
            throw new AuraHandledException('Insufficient permissions : Object Checklist Item');
        }
        
        // system.debug('recordId : '+recordId);
        List<Checklist__c> checklistRecords = new List<Checklist__c>();
        String query = 'Select Id, Name, CreatedById, OwnerId, Is_Checklist_Template_Locked__c, Checklist_Title__c, Is_Checklist_Locked__c, Percentage_Completion__c, Description__c,Due_Days__c, CreatedDate, Due_Date__c, Checklist_Template__c, Checklist_Template__r.IsLocked__c, Sequential__c,   (Select Id, Item__c, Item_Order__c, Checked__c,Description__c, CompletedBy__c, CompletedBy__r.Name, format(CompletedDate__c), Checklist__c From CheckList_Items__r order by Item_Order__c ASC )  From Checklist__c Where ';
        String fieldName = getRelatedFieldApiNameByRecordId(recordId);//'Account__c'; 
        
        
        
        query += String.escapeSingleQuotes(fieldName) + ' = :recordId Order By Due_Date__c NULLS LAST';
        
        // system.debug('query : '+query);
        if(String.isNotBlank(fieldName)){
            try{
                checklistRecords = database.query(query, Accesslevel.USER_MODE);
            }catch(QueryException qe){
                //// system.debug('qe.getInaccessibleFields()' +qe.getInaccessibleFields());
                // system.debug('qe.getMessage()' +qe.getMessage());
                
                Map<String, Set<String>> inAccessibleFeilds = (Map<String, Set<String>>) qe.getInaccessibleFields();
                String msg = 'Operation failed due to fields being inaccessible : ';
                for(String str : inAccessibleFeilds.keySet()){                   
                    
                    msg += '' + str + ' - ' + String.join(inAccessibleFeilds.get(str), ', ')+' /n';
                }
                
                throw new AuraHandledException(msg);
            }
            // system.debug('checklistRecords : '+checklistRecords.size());
        }
        return checklistRecords;
    }
    
    /*
     * @param recordId is the Checklist Template recordId
     * returns the Checklist_Template__c with Items.
    */
    @AuraEnabled
    public Static Checklist_Template__c fetchTemplate(String recordId){
        try{
            Checklist_Template__c checkListTemplate = [Select id, Name, Active__c, Due_Days__c, CreatedDate, Description__c, Sequential__c, IsLocked__c,
                                                    (Select id, Item__c, Item_Order__c, Description__c, Checklist_Template__c from Checklist_Template_Items__r order by Item_Order__c ) 
                                                    From Checklist_Template__c Where Id = :recordId WITH USER_MODE Limit 1 ];
            return checkListTemplate;
        }catch(QueryException  e){
            throw new AuraHandledException('Fetching Checklist Template Failed : '+e.getmessage());
        }catch(Exception  e){
            throw new AuraHandledException('Fetching Checklist Template Failed : '+e.getmessage());
        }
    }

    /*
     * @param recordId is the Checklist Item recordId
     * @param isChecked is the checked value 
     * This method update the check value in checklist item
    */
    @AuraEnabled
    public Static Checklist_Item__c saveCheckListItems(String recordId, String isChecked){
        Checklist_Item__c checklistItem = new Checklist_Item__c();
        //[SELECT Id, Checked__c, Checklist__c FROM Checklist_Item__c WHERE Id =: recordId];
        checklistItem.Id = (Id) recordId;
        //checklistItem.Checked__c = (Boolean) isChecked;

        checklistItem.Checked__c = isChecked;
        
        if( isChecked != 'No'){
            checklistItem.CompletedDate__c = system.now();
            checklistItem.CompletedBy__c = Userinfo.getUserId();
        }else{
            checklistItem.CompletedDate__c = null;
            checklistItem.CompletedBy__c = null;
        }

        List<Checklist_Item__c> checklistItems = new List<Checklist_Item__c>{checklistItem};
        
        if(!checklistItems.isEmpty()){
            /* FLSChecker.FLSCheckWrapper fl2 = new FLSChecker.FLSCheckWrapper();
            fl2 = FLSChecker.dmlUpdate(checklistItems); 
            if(!fl2.isSuccess){
                System.debug('ChecklistManager class, saveCheckListItems method, Inside if(!fl2.isSuccess).');
                throw new AuraHandledException(fl2.message);
            }*/
            
            update as user checklistItems;

            // checklistItem = [Select Id, Item__c, Item_Order__c, Checked__c, Description__c, LastModifiedById, LastModifiedBy.Name, format(LastModifiedDate), Checklist__c From Checklist_Item__c Where Id =: checklistItem.Id WITH USER_MODE ];
            String query = 'Select Id, Item__c, Item_Order__c, Checked__c, Description__c, CompletedBy__c, CompletedBy__r.Name, format(CompletedDate__c), Checklist__c From Checklist_Item__c Where Id =: recordId';
            checklistItem = database.query(query, Accesslevel.USER_MODE);
            return checklistItem;
        }else{
            return new Checklist_Item__c();
        }

    }

    /*
     * @param records is the List<Checklist_Item__c> 
     * This method used to update the Item order value in checklist items
    */
    @AuraEnabled
    public Static void updateItemsOrder(List<Checklist_Item__c> records){
        try{
            if(!records.isEmpty()){
                /*FLSChecker.FLSCheckWrapper fl = new FLSChecker.FLSCheckWrapper();
                fl = FLSChecker.dmlUpdate(records); 
                if(!fl.isSuccess){
                    throw new AuraHandledException(fl.message);
                }*/
                
                update as user (List<Checklist_Item__c>) records;
            }
            
        }catch(AuraHandledException e){
            throw e;
        }catch(Exception e){
            throw new AuraHandledException('Update Order Failed : '+e.getmessage());
        }
    }
    
    /*
     * @param recordId is recordid of any sObject
     * This method is returns the relation field api name with Checklist 
    */
    public Static String getRelatedFieldApiNameByRecordId(String recordId){
        try{
            return getRelatedFieldNameByObjectName(getSobjectName(recordId)).containsKey('fieldApiName') ? (String) getRelatedFieldNameByObjectName(getSobjectName(recordId)).get('fieldApiName') : '';       
        }catch(Exception e){
            throw new AuraHandledException('Error while Fetching the Relationship field : '+e.getmessage());
        }
    }
    
    /*
     * @param recordId is recordid of any sObject
     * This method is returns the map of relation field api name, label, relatedObjectApiName, objectApiName with Checklist object
    */
    @AuraEnabled (cacheable = true)
    public Static Map<String, object> getRelatedFieldNameByRecordId(String recordId){
        try{
            return getRelatedFieldNameByObjectName(getSobjectName(recordId));       
        }catch(Exception e){
            throw new AuraHandledException('Error while Fetching the Relationship field : '+e.getmessage());
        }
    }
      
    /*
     * @param recordId is recordid of any sObject
     * This method is returns recordId's object name.
    */
    public static String getSobjectName(String recordId){
        Id recId =  (id) recordId;
        String ObjectName = recId.getSObjectType().getDescribe().getName();
        return ObjectName;
    }
    
    /*
     * @param objectName is apiName of any sObject
     * This method is returns the map of relation field api name, label, relatedObjectApiName, objectApiName with Checklist object 
    */
    public Static Map<String, object> getRelatedFieldNameByObjectName(String objectName){
        String objName = Checklist__c.getSObjectType().getDescribe().getName();
        
        Map<String, object> RelatedField = new Map<String, object>{'label' => '', 'fieldApiName' => '',
            'objectApiName' => 'kt_checklist__Checklist__c',
            'relatedObjectApiName' => objectName,
            'displayFieldinUI' => true
            };
                // if(specialObjects.contains(objectName.toUpperCase())){
                //     RelatedField.put('label', 'Related To' );
                //     RelatedField.put('fieldApiName', 'kt_checklist__Related_To_Id__c');
                //     RelatedField.put('displayFieldinUI', false);
                    
                // }else{
                //     RelatedField = getRelationObjectField(objectName, objName);
                // }

        

        RelatedField = getRelationObjectField(objectName, objName);
        if(!RelatedField.containsKey('fieldApiName') || 
           (RelatedField.get('fieldApiName') != null && 
            String.isBlank((String) RelatedField.get('fieldApiName')) ) ){
                
                List<Checklist_Relationship__mdt> ChecklistRelationships = new List<Checklist_Relationship__mdt>([Select Id, IsActive__c, Object_Name__c from Checklist_Relationship__mdt 
                                                                                                                  Where Object_Name__c = :objectName AND IsActive__c = true]);
                Checklist_Relationship__mdt ChecklistRelationship;
                if(!ChecklistRelationships.isEmpty()){
                    ChecklistRelationship = ChecklistRelationships[0];
                }
                
            if(ChecklistRelationship  != null && ChecklistRelationship.Object_Name__c == objectName && ChecklistRelationship.IsActive__c == true){
                RelatedField = new Map<String, object>{'label' => 'Related To', 
                                                        'fieldApiName' => 'kt_checklist__Related_To_Id__c', 
                                                        'objectApiName' => 'kt_checklist__Checklist__c', 
                                                        'relatedObjectApiName' => objName,
                                                        'displayFieldinUI' => false
                                                        };
           
            }
        }

        // return getRelationObjectField(objectName, objName);
        return RelatedField;
    }
    
    /*
     * @param objectApiName is apiName of any sObject
     * This method is returns the map of relationship fields with object names.
    */
    @AuraEnabled (cacheable = true)
    public static Map<String, String> getRelationObjectFieldMap(String objectApiName){
        //String RelatedObjName = '';
        Map<String, String> relationshipFields = new Map<String, String>();
        
        // Describe the custom object
        Schema.DescribeSObjectResult testObjectDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        // Describe the fields for the custom object
        List<Schema.SObjectField> fields = testObjectDescribe.fields.getMap().values();
        
        // Loop through the fields to find the relationship fields and their related objects
        for (Schema.SObjectField field : fields) {
            // Check if the field is a reference (relationship) field
            if (field.getDescribe().getType() == Schema.DisplayType.REFERENCE && !field.getDescribe().isNamePointing() ) {
                // Get the related object
                // // system.debug('relationshipFields : '+ field.getDescribe().getReferenceTo());
                String relatedObjectName = field.getDescribe().getReferenceTo()[0].getDescribe().getName();
                
                // Add the field and its related object to the map
                relationshipFields.put(field.getDescribe().getName(), relatedObjectName);
            }
        }
        // system.debug('relationshipFields : '+ relationshipFields.size());
        //RelatedObjName = relationshipFields.get(fieldName);
        return relationshipFields;
    }
    
    /*
     * @param objectApiName is apiName of any sObject
     * This method is returns the map of relation field api name, label, relatedObjectApiName, objectApiName with Checklist object.
    */
    public static Map<String, String> getRelationObjectField(String RelatedObjectName, String objectApiName){
        Map<String, String> RelatedField = new Map<String, String>{'label' => '', 'fieldApiName' => '', 'objectApiName' => objectApiName, 'relatedObjectApiName' => RelatedObjectName};
            String RelatedFieldName = '';
        //Map<String, String> relationshipFields = new Map<String, String>();
        
        // Describe the custom object
        Schema.DescribeSObjectResult testObjectDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        // Describe the fields for the custom object
        List<Schema.SObjectField> fields = testObjectDescribe.fields.getMap().values();
        
        // Loop through the fields to find the relationship fields and their related objects
        for (Schema.SObjectField field : fields) {
            // Check if the field is a reference (relationship) field
            if (field.getDescribe().getType() == Schema.DisplayType.REFERENCE && !field.getDescribe().isNamePointing() ) {
                // Get the related object
                
                if(RelatedObjectName == field.getDescribe().getReferenceTo()[0].getDescribe().getName()){
                    RelatedField.put('label', field.getDescribe().getLabel() );
                    RelatedField.put('fieldApiName', field.getDescribe().getName() );
                    break; 
                }
                // Add the field and its related object to the map
                //relationshipFields.put(field.getDescribe().getName(), relatedObjectName);
            }
        }
        // return RelatedFieldName;
        return RelatedField;
    }

    /*
     * @param ChecklistRecord is List<Checklist__c> 
     * @param Items is List<Checklist_Item__c> in JSON
     * possible input is only one record in ChecklistRecord, we are creating first record and linking that checklist while creating the items.
     * This method creates the Checklist and Items.
     * This method is returns the inserted Checklist__c with Items.
    */
    @AuraEnabled
    public Static Checklist__c saveChecklistAndItems(String recordId, List<Checklist__c> ChecklistRecord, String Items){
        try{
            	
            Boolean CreateChecklistItemsInSystemMode = false;
                if(!ChecklistRecord.isEmpty()){
                
                    /*FLSChecker.FLSCheckWrapper fl = new FLSChecker.FLSCheckWrapper();
                    fl = FLSChecker.dmlInsert(ChecklistRecord); 
                    if(!fl.isSuccess){
                        throw new AuraHandledException(fl.message);
                    }*/
                   
                    
                    if(ChecklistRecord[0].Related_To_Id__c != null){
                        String Name;
                        String ObjName = getSobjectName(recordId);
                        ObjectKeyField__mdt objectKeyFields = ObjectKeyField__mdt.getInstance(ObjName);
                        String keyField = objectKeyFields != null ? objectKeyFields.Field_Name__c : 'Name';
                        sObject rec = database.query('Select Id,' + keyField + ' From ' + ObjName + ' Where Id =:recordId', Accesslevel.USER_MODE);
                        Name = (String) rec.get(keyField);
                                    
                        ChecklistRecord[0].Related_To_Object__c = ObjName;
                        if(String.isNotBlank(Name)){
                            ChecklistRecord[0].Related_To__c = Name;
                        }else{
                            ChecklistRecord[0].Related_To_Id__c = ChecklistRecord[0].Related_To_Id__c;
                        }
                    }
                    
                    if(ChecklistRecord[0].OwnerId != null && ChecklistRecord[0].OwnerId != Userinfo.getUserId()){
                        CreateChecklistItemsInSystemMode = true;
                        CheckListTriggerHandler.runDMLInSystemMode = true;
                    }else if(Site.getSiteId() != null){
                        CreateChecklistItemsInSystemMode = true;
                        CheckListTriggerHandler.runDMLInSystemMode = true;
                    }
                   
                    insert as user ChecklistRecord;


                    List<Checklist_Item__c>  ChecklistItemRecords = (List<Checklist_Item__c> ) JSON.deserialize(Items, List<Checklist_Item__c>.class); 
                    
                    if(!ChecklistItemRecords.isEmpty()){
                        for(Checklist_Item__c c :ChecklistItemRecords){
                            c.Checklist__c  = ChecklistRecord[0].Id;
                        }
                        /*
                        FLSChecker.FLSCheckWrapper fl2 = new FLSChecker.FLSCheckWrapper();
                        fl2 = FLSChecker.dmlInsert(ChecklistItemRecords); 
                        if(!fl2.isSuccess){
                            throw new AuraHandledException(fl2.message);
                        }*/
                        
                        if(CreateChecklistItemsInSystemMode){
                            CheckListTriggerHelper.createChecklistItemsInSystemMode(ChecklistItemRecords);
                        }else{
                        insert as user ChecklistItemRecords;
                    }
                    }
                    
                    if(CreateChecklistItemsInSystemMode){
                        List<Checklist__c> checklistRecords = new List<Checklist__c>([Select Id, Name, Is_Checklist_Template_Locked__c, Is_Checklist_Locked__c, Checklist_Title__c, Percentage_Completion__c, Description__c,Due_Days__c, CreatedDate, Due_Date__c, Checklist_Template__c, Checklist_Template__r.IsLocked__c, OwnerId, CreatedById, Sequential__c,  (Select Id, Item__c, Item_Order__c, Checked__c,Description__c From CheckList_Items__r order by Item_Order__c ASC )  From Checklist__c Where Id =: ChecklistRecord[0].Id WITH USER_MODE]);
                        if(!checklistRecords.isEmpty()){
                            return checklistRecords[0];
                        }else{
                            return new Checklist__c();
                        } 
                    }else{
                        Checklist__c checklist = [Select Id, Name, Is_Checklist_Template_Locked__c, Is_Checklist_Locked__c, Checklist_Title__c, Percentage_Completion__c, Description__c,Due_Days__c, CreatedDate, Due_Date__c, Checklist_Template__c, Checklist_Template__r.IsLocked__c, OwnerId, CreatedById, Sequential__c,  (Select Id, Item__c, Item_Order__c, Checked__c,Description__c From CheckList_Items__r order by Item_Order__c ASC )  From Checklist__c Where Id =: ChecklistRecord[0].Id WITH USER_MODE];
                    return checklist;
                    }
                    
                }else{
                    throw new AuraHandledException('Checklist Not Found');
                }
        }catch(AuraHandledException e){
            throw e;
        }catch(QueryException  e){
            // system.debug('test Exception '+e.getmessage());
            throw new AuraHandledException('Fetching Checklist Items Failed : '+e.getmessage());
        }catch(Exception e){
            throw new AuraHandledException(e.getmessage());
        }
    }

    /*
     * @param checklistId is Checklist recordId
     * @param Item is Checklist_Item__c in JSON
     * Creating new Checklist item under given Checklist.
     * This method is returns Checklist__c with with inserted Items.
    */
    @AuraEnabled
    public Static Checklist__c createChecklistItem(String Item, String checklistId){
        try{
            Checklist_Item__c ChecklistItemRecord = (Checklist_Item__c ) JSON.deserialize(Item, Checklist_Item__c.class);
            ChecklistItemRecord.Checklist__c = checklistId;
            /* sfge-disable-next-line ApexFlsViolationRule */
            Integer order = Integer.valueOf([Select Count(Id) Order  From CheckList_Item__c Where Checklist__c = :checklistId WITH USER_MODE][0].get('Order'));
            if(order != null){
                ChecklistItemRecord.Item_Order__c = ++order;
            }
                        
            List<Checklist_Item__c> checklistItems = new List<Checklist_Item__c>{ChecklistItemRecord};
            if(!checklistItems.isEmpty()){
                /*FLSChecker.FLSCheckWrapper fl2 = new FLSChecker.FLSCheckWrapper();
                fl2 = FLSChecker.dmlInsert(checklistItems); 
                // system.debug('test Exception '+fl2);
                if(!fl2.isSuccess){
                    throw new AuraHandledException(fl2.message);
                }*/
                
                insert as user checklistItems;
            }
            
            // Checklist__c checklist = [Select Id, Name, Is_Checklist_Template_Locked__c, Checklist_Title__c, Percentage_Completion__c, Description__c,Due_Days__c, CreatedDate, Due_Date__c, Checklist_Template__c, Checklist_Template__r.IsLocked__c, OwnerId, CreatedById, Sequential__c,   (Select Id, Item__c, Item_Order__c, Checked__c,Description__c, format(LastModifiedDate), Checklist__c, CompletedBy__c, CompletedBy__r.Name, format(CompletedDate__c) From CheckList_Items__r order by Item_Order__c ASC )  From Checklist__c Where Id =: checklistId WITH USER_MODE];
            // return checklist;
             
            String query = 'Select Id, Name, Is_Checklist_Template_Locked__c, Checklist_Title__c, Percentage_Completion__c, Description__c,Due_Days__c, CreatedDate, Due_Date__c, Checklist_Template__c, Checklist_Template__r.IsLocked__c, OwnerId, CreatedById, Sequential__c,   (Select Id, Item__c, Item_Order__c, Checked__c,Description__c, format(LastModifiedDate), Checklist__c, CompletedBy__c, CompletedBy__r.Name, format(CompletedDate__c) From CheckList_Items__r order by Item_Order__c ASC )  From Checklist__c Where Id =: checklistId';
            Checklist__c checklist = database.query(query, Accesslevel.USER_MODE);
            return checklist;
            
        }catch(AuraHandledException  e){
            throw e;
        }catch(QueryException  e){
            // system.debug('test Exception '+e.getmessage());
            throw new AuraHandledException('Fetching Checklist Items Failed : '+e.getmessage());
        }catch(Exception e){
            // system.debug('test Exception  '+e.getmessage());
            // system.debug('test Exception  '+e.getLinenumber());
            throw new AuraHandledException(e.getmessage());
        }
    }
    
    /*
     * @param checklistId is Checklist recordId
     * Deleting the checklist record.
    */
    @AuraEnabled
    public static void deleteChecklist(String checklistId){
        try{
            system.debug('1'+checklistId);
            system.debug('1'+String.isNotBlank(checklistId));
            system.debug('adfd '+checklistId instanceof Id);
            
            if(String.isNotBlank(checklistId) && checklistId instanceof Id){
            	delete as user new Checklist__c(id=checklistId);
            }else{
                throw new AuraHandledException('Invalid Checklist Id '+checklistId);
            }
        }catch(AuraHandledException  e){
            throw e;
        }catch(Exception e){
            if(!e.getmessage().contains('ENTITY_IS_DELETED')){
               throw new AuraHandledException(e.getmessage()); 
            }
        }
    }

    /*
     * @param checkListItemId is the record Id of a single item in a checklist
     * Deleting the checklist item record & update item orders.
    */
    @AuraEnabled
    public static void deleteChecklistItem(String checkListItemId, String checkListId){
        try {
            System.debug('***checkListId:'+checkListId);
            if (String.isNotBlank(checkListItemId) && checkListItemId instanceof Id && String.isNotBlank(checkListId) && checkListId instanceof Id) {
                System.debug('***befr query');
                Checklist__c parentCL = [SELECT Id, Name, (SELECT Id, Item_Order__c FROM CheckList_Items__r ORDER BY Item_Order__c ASC) 
                    FROM Checklist__c 
                    WHERE Id =: checkListId 
                    LIMIT 1
                ];
                System.debug('***parentCL:'+parentCL);
                
                if (parentCL == null || parentCL.CheckList_Items__r.isEmpty()) {
                    throw new AuraHandledException('Checklist not found or has no items.');
                }
    
                List<Checklist_Item__c> items = parentCL.CheckList_Items__r;
                Checklist_Item__c itemToDelete;
                
                for (Checklist_Item__c item : items) {
                    if (item.Id == checkListItemId) {
                        itemToDelete = item;
                        break;
                    }
                }
    
                if (itemToDelete == null) {
                    throw new AuraHandledException('Checklist Item not found.');
                }
    
                Integer deletedItemOrder = (Integer) itemToDelete.Item_Order__c;
    
                delete as user new Checklist_Item__c(id=checkListItemId);
    
                List<Checklist_Item__c> itemsToUpdate = new List<Checklist_Item__c>();
    
                for (Checklist_Item__c item : items) {
                    if (item.Item_Order__c > deletedItemOrder) {
                        // item.Item_Order__c = deletedItemOrder; 
                        itemsToUpdate.add(new Checklist_Item__c(Id=item.Id, Item_Order__c=deletedItemOrder));
                        system.debug('inside items loop..'+deletedItemOrder); 
                        
                        deletedItemOrder++;
                    }
                }
    
                if (!itemsToUpdate.isEmpty()) {
                     database.update(itemsToUpdate, Accesslevel.USER_MODE);
                }
            }else{
                system.debug('inside else.');
                throw new AuraHandledException('Invalid Checklist Item Id '+checkListItemId);
            }
        }catch(AuraHandledException  e){
            system.debug('inside catch 1');
            throw e;
        }catch(Exception e){
            system.debug('***inside catch 2, e.getLinenumber():'+e.getLinenumber());
            if(!e.getmessage().contains('ENTITY_IS_DELETED')){
               throw new AuraHandledException(e.getmessage()); 
            }
        }
    }


    /*
    * @param 
    * Save the Item and it's description after editing it.
    */
    @AuraEnabled
    public static Checklist_Item__c saveEditedItem(String itemId, String updatedItem, String updatedDesc){
        
        Checklist_Item__c checklistItem = new Checklist_Item__c();
        checklistItem.Id = (Id) itemId;
        checklistItem.kt_checklist__Item__c = updatedItem;
        checklistItem.kt_checklist__Description__c = updatedDesc;

        List<Checklist_Item__c> checklistItems = new List<Checklist_Item__c>{checklistItem};
        
        if(!checklistItems.isEmpty()){

            update as user checklistItems;

            String query = 'Select Id, Item__c, Item_Order__c, Checked__c, Description__c, CompletedBy__c, CompletedBy__r.Name, format(CompletedDate__c), Checklist__c From Checklist_Item__c Where Id =: itemId';
            checklistItem = database.query(query, Accesslevel.USER_MODE);
            return checklistItem;
        }else{
            return new Checklist_Item__c();
        }
    }
}