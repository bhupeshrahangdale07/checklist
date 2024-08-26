/*
     * @description: Controller class for LWC of Checklist Templates. To create and edit the Checklist Templates records
     * @Author: Kandisa Technologies
*/

public with sharing class MyChecklistsPageManager {
    /*
     * @description: To fetch Checklists and it's Items when the MyChecklist tab is opened or any category is clicked upon
     * @return: List<Checklist__c>
     * @param: userId
    */
    @AuraEnabled
    public Static List<Checklist__c> fetchCheckLists(String userId){
        System.debug('User Id:'+ userId);
        try{
           // Map<String, String> objectKeys = fetchObjectKeyFields();
            
            List<FieldNamesWrapper> fields = getFieldMap('kt_checklist__Checklist__c');
            //System.debug('**fields:'+fields);
            String query = 'Select Id, Name, Is_Checklist_Locked__c, Checklist_Title__c, Description__c, Percentage_Completion__c, Due_Days__c, Due_Date__c, CreatedDate, OwnerId, Is_Checklist_Template_Locked__c,  '; //Template_Locked__c is removed.
            
            for(FieldNamesWrapper field: fields){
                if(!field.value.contains('Checklist_Template__c')){  // Remove "&& !field.value.contains('Assign_To_User__c')" condition after deleting fAssign_To_User__c field.
                    query += field.value + ', ';
                    if(field.value.endswith('__c')){
                        String keyField = '__r.Name';
                        //system.debug('field.relatedsobjectName'+field.relatedsobjectName);
                        ObjectKeyField__mdt objectKeyFields = ObjectKeyField__mdt.getInstance(field.relatedsobjectName);
                        if(objectKeyFields != null){
                            keyField = '__r.' + objectKeyFields.Field_Name__c;
                        }
                        //system.debug('keyField '+keyField);
                        query += field.value.replaceAll('__c', keyField) + ', ';
                    }
                }
            }
            
            query += '(Select Id, Item__c, Item_Order__c, Checked__c, Description__c From CheckList_Items__r order by Item_Order__c ASC) '
                + 'From Checklist__c WHERE OwnerId = :ownerId Order By Due_Date__c Asc';
            
            // System.debug('**Query:'+query);
            
            List<Checklist__c> checklistRecords = Database.queryWithBinds(query, new Map<String, Object>{'ownerId' => userId}, Accesslevel.USER_MODE);
            
            // System.debug('**checklistRecords:'+checklistRecords);
            
            return checklistRecords;
        } catch(QueryException  e){
            // system.debug('test Exception '+e.getmessage());
            String errorMessage = e.getmessage();
            if(errorMessage.startsWithIgnoreCase('No such column \'Name\' on entity')){
                    // Extract the column name and entity from the error message
                    // This assumes the error message follows the format: "No such column 'ColumnName' on entity 'EntityName'."
                    Pattern regex = Pattern.compile('No such column \'(.*?)\' on entity \'(.*?)\'.');
                    Matcher matcher = regex.matcher(errorMessage);
                    
                    if(matcher.find()) {
                        String columnName = matcher.group(1);
                        String entityName = matcher.group(2);
                        
                        errorMessage = 'No such Field \'' + columnName + '\' on entity \'' + entityName + '\'. Please ensure that the field exists or create a corresponding record in the ObjectKeyField custom metadata.';
                    }
            }
            throw new AuraHandledException('Fetching Checklist Or Items Failed : '+errorMessage);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    /*
     * @description: To get field map of the object kt_checklist__Checklist__c
     * @return: List<FieldNamesWrapper>
     * @param: sObjectType
    */
    public static List<FieldNamesWrapper> getFieldMap(String sObjectType) {
        List<FieldNamesWrapper> options = new List<FieldNamesWrapper>();
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        Schema.SObjectType targetType = schemaMap.get(sObjectType);
        Map<String, Schema.SObjectField> fieldMap = targetType.getDescribe().fields.getMap();
        // System.debug('**fieldMap:'+fieldMap);
        for(String fieldName : fieldMap.keySet()){
            Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
            String apiName = fieldDescribe.getName();
            // System.debug('**apiName:'+apiName);
            if(String.isNotBlank(apiName) && fieldDescribe.getType() == Schema.DisplayType.REFERENCE && fieldDescribe.isCustom()){
                System.debug('**apiName2:'+apiName);
                options.add(new FieldNamesWrapper(fieldMap.get(fieldName).getDescribe().getLabel(), apiName, String.ValueOF(fieldMap.get(fieldName).getDescribe().getType()), String.valueOf(fieldDescribe.getReferenceTo()[0]) ));
            }
        }
        return options;
    }
    
    /*
     * @description: To get the related object name and pass it to getIconName method and get the icon name and return a map with object name vs its icon name
     * @return: Map<String, String>
     * @param: objectApiName
    */
    @AuraEnabled (cacheable = true)
    public static Map<String, String> getRelationObjectIconFieldMap(String objectApiName){
        Map<String, String> relationshipFields = new Map<String, String>();
        Schema.DescribeSObjectResult testObjectDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        List<Schema.SObjectField> fields = testObjectDescribe.fields.getMap().values();
        for (Schema.SObjectField field : fields) {
            if (field.getDescribe().getType() == Schema.DisplayType.REFERENCE && !field.getDescribe().isNamePointing() ) {
                String relatedObjectName = field.getDescribe().getReferenceTo()[0].getDescribe().getName();
                
                String icon = getIconName(relatedObjectName);
                relationshipFields.put(field.getDescribe().getName(), icon);
            }
        }
        return relationshipFields;
    }
    
    /*
     * @description: To get the icon name of the supplied standard or custom object name
     * @return: String
     * @param: sobjectApiName
    */
    @AuraEnabled
    public static String getIconName(String sobjectApiName){
        String iconName;
        List<Schema.DescribeTabSetResult> tabSetDesc = Schema.DescribeTabs();
        List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
        List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();
        
        for(Schema.DescribeTabSetResult tsr : tabSetDesc) { 
            tabDesc.addAll(tsr.getTabs()); 
        }
        
        for(Schema.DescribeTabResult tr : tabDesc) {
            if( sobjectApiName == tr.getSobjectName() ) {
                if( tr.isCustom() ) {
                    iconDesc.addAll(tr.getIcons());
                } else {
                    iconName = 'standard:' + sobjectApiName.toLowerCase();
                }
            }
        }
        for (Schema.DescribeIconResult ir : iconDesc) {
            if (ir.getContentType() == 'image/svg+xml'){
                iconName = 'custom:' + ir.getUrl().substringBetween('custom/','.svg').substringBefore('_');
                break;
            }
        }
        return iconName;
    }
    
    
    public class FieldNamesWrapper {
        /**
        * @description This variable will hold field label
        */
        @AuraEnabled public String label { get; set; }
        /**
        * @description This variable will hold field value
        */
        @AuraEnabled public String value { get; set; }
        /**
        * @description This variable will hold field Type
        */
        @AuraEnabled public String fieldType { get; set; }
        
        /**
        * @description This variable will hold field Type
        */
        @AuraEnabled public String relatedsobjectName { get; set; }
        
        /**
        * @description Constructor of FieldNamesWrapper
        * @param label
        * @param value
        * @param fieldType
        */
        public FieldNamesWrapper(String label, String value, String fieldType, String relatedsobjectName) {
            this.label = label;
            this.value = value;
            this.fieldType = fieldType;
            this.relatedsobjectName = relatedsobjectName;
        }
    }
    
    /**
     *  @description Return object key fields.
     *
     * @return Map of object key fields.
     
    public static Map<String, String> fetchObjectKeyFields() {
        Map<String, String> objectKeyFieldMap = new Map<String, String>();

        for (ObjectKeyField__mdt objectKeyFieldMdt : [
            SELECT Id, MasterLabel, Field_Name__c
            FROM ObjectKeyField__mdt 
        ]) {
            objectKeyFieldMap.put(objectKeyFieldMdt.MasterLabel, objectKeyFieldMdt.Field_Name__c);
        }
        return objectKeyFieldMap;
    }
	*/
    
}