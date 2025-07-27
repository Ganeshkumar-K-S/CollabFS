db.createCollection(
    "activites",
    {
        validator : {
            $jsonSchema : {
                bsonType : "object",
                required : ["user_id","group_id","activity_type","file_id","timestamp"],
                properties : {
                    user_id : {
                        bsonType : "string",
                        description : "user_id must be of type string"
                    },
                    group_id : {
                        bsonType : "string",
                        description : "group_id must be of type string"
                    },
                    activity_type : {
                        bsonType : "string",
                        description : "activity must be of type string"
                    },
                    file_id : {
                        bsonType : "objectId",
                        description : "file_id must be of type objectid"
                    },
                    timestamp : {
                        bsonType : "date",
                        description : "description must be of type date"
                    }
                }
            }
        },
        validationLevel : "strict",
        validationAction : "error"
    }
);