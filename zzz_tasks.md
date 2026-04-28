Programs Lists:
- (Logo, Name, Short description), MGU Organization, Line of Business, (by default status: Draft, Published, Archived)

Create Program:
- Logo, Name, Short description, 
  MGU Organization, 
  Line of Business, 


Program Dashboard:
- Overview 

- Connections // Later

- Pricing
    (Ability to re-order items in tables)
     pricing:[{ 
        type: Premium / Earned Fees / Unearned Fees / Taxes
        displayName:
        description:
        expression: // Final expression for pricing
        expressionDescription: // Final expression description for pricing
        condition: expression // if true, this line item will be used for pricing
        rounding: dollar / cents
    }]
    limits_Deductibles: [{
        type: Deductible / Limit
        name:
        expression: 
        condition: expression // if true, this line item will be used for limits
    }]

- Binding Requirements
    Reorder - table

    name:
    description:
    allowCustomer: boolean // if false, customer will not be able to upload this document,
    type: {
        Answer_Question, 
        Upload_Document, 
        Sign_Document,  
        Payment, 
        Print_And_Upload
    }
    
    _template: document_template_id // for print and upload

- Policy Forms 
    name:
    formNumber:
    condition: expression // if true, this form will be used for policy issuance
    form_type: Mandatory, Conditional, Optional
    expression: 
    sequenceNumber:
    rateType: Flat / Per Percentage
    rate:
    template: dropdown

- Quote Pack 

- Settings

    Policy Issuance
    * Policy Number Logic: 
    * policy_expiry: days from application, expiry from application, anydate_from_application_date + 365 days, current_date + 1 year
    * Next Policy Number: Expression logic
    * Policy renewal Number Logic: Expression logic

    * Email Customization

    Event / Template 
    Policy Issued / Default template        (Preview) / Edit

    * States
    Comma Separated list of states and option to change states

-------------------------------------------------------------------------------------------------------

1. Cleanup unwanted - Apps, chats, Tasks, Sign-op2
2. Create page for listing products 
3. facility to create new product
4. Create product dashboard UI
5. Work on tabs

Kalash
Tejas
Sohel
Saurav
Muzzafer
Trupti
Pushpak








Create page for listing products & facility to create new product
* While creating new product ask for basic details as below:
    Product Name, Description, Short Description, MGU Organization,  Logo, Line of Business, States (by default status: Draft, Published, Archived)

* Product Connections:
    * Create page for listing product connections & facility to create new product connection

Email Templates:

Document Templates:
    * Quotation Template
    * Policy Issuance Template
    * Certificate Template

product_policy_forms CRUD

     _documentTemplate:
    _org:
    _product:
    name:
    formNumber:
    condition: expression // if true, this form will be used for policy issuance
    form_type: Mandatory, Conditional, Optional
    expression: 
    sequenceNumber:
    rateType: Flat / Per Percentage
    rate:

Binding Requirements:
    name:
    description:
    allowCustomer: boolean // if false, customer will not be able to upload this document,
    type: {
        Answer_Question, 
        Upload_Document, 
        Sign_Document,  
        Payment, 
        Print_And_Upload
    }
    
    _template: document_template_id // for print and upload

Rating configuration
{
    _product
    pricing:[{
        type: Premium / Earned Fees / Unearned Fees / Taxes
        displayName:
        description:
        expression: // Final expression for pricing
        expressionDescription: // Final expression description for pricing
        condition: expression // if true, this line item will be used for pricing
        rounding: dollar / cents
    }]
    limits_Deductibles: [{
        type: Deductible / Limit
        name:
        expression: 
        condition: expression // if true, this line item will be used for limits
    }]
    version:1  //auto_increment number per product  
}

Product Settings:
    * Policy Number Logic:
    * policy_expiry: days from application, expiry from application, anydate_from_application_date + 365 days, current_date + 1 year
    * Next Policy Number: Expression logic
    * Policy renewal Number Logic: Expression logic



    _mgu: { type: Schema.Types.ObjectId, ref: 'Organization' }, // MGU org reference
    programName: { type: String, required: true },
    description: String,
    shortDescription: String,
    logo: String,
    lineOfBusiness: String,
    
    states: [String],
    _form: { type: Schema.Types.ObjectId, ref: 'LeadForm' }, // form used for quoting
    quotation_templates: [
      {
        template: { type: Schema.Types.ObjectId, ref: 'DocumentTemplate' },
        condition: String, // expression
      },
    ],
    Policy_Issuance: {
      expression: String, // e.g. {NO}, {MM}, {YY}, {YYYY}
      next_policy_number: { type: String, default: '1000' },
      policy_expiry: String, // expression e.g. "effective_date + 60 days"
    },
    certificate_template: {
      document_template_id: { type: Schema.Types.ObjectId, ref: 'DocumentTemplate' },
    },
    policy_renewal: {
      renewal_policy_number: String, // expression
    },
    currentRatingConfig: Schema.Types.Mixed, // Additional rating config reference
    // *Improvised line:
    // Keep an active/inactive status for product
    isActive: { type: Boolean, default: true }, 













