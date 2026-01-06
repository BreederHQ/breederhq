# Marketing & Messaging Domain

## Mermaid ERD

```mermaid
erDiagram
    Campaign {
        int id PK
        int tenantId FK
        int offspringGroupId FK
        string name
        enum channel
        datetime startedAt
        datetime endedAt
        int budgetCents
        int spendCents
        int impressions
        int clicks
        int inquiries
        int reservations
        int conversions
        string utmSource
        string utmMedium
        string utmCampaign
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    CampaignAttribution {
        int id PK
        int tenantId FK
        int campaignId FK
        int offspringId FK
        float weight
        datetime createdAt
    }

    Template {
        int id PK
        int tenantId FK
        string name
        string key UK
        enum channel
        enum category
        enum status
        string description
        int createdByPartyId FK
        datetime lastUsedAt
        datetime createdAt
        datetime updatedAt
    }

    TemplateContent {
        int id PK
        int templateId FK
        string subject
        string bodyText
        string bodyHtml
        json metadataJson
        datetime createdAt
        datetime updatedAt
    }

    AutoReplyRule {
        int id PK
        int tenantId FK
        enum channel
        boolean enabled
        int templateId FK
        enum triggerType
        int cooldownMinutes
        json businessHoursJson
        datetime createdAt
        datetime updatedAt
    }

    AutoReplyLog {
        int id PK
        int tenantId FK
        enum channel
        int partyId FK
        int threadId FK
        int ruleId FK
        int templateId
        enum status
        string reason
        datetime createdAt
    }

    EmailSendLog {
        int id PK
        int tenantId FK
        string to
        string from
        string subject
        string templateKey
        int templateId
        enum category
        string provider
        string providerMessageId
        int relatedInvoiceId FK
        enum status
        json error
        json metadata
        datetime createdAt
    }

    MessageThread {
        int id PK
        int tenantId FK
        string subject
        boolean archived
        string inquiryType
        string sourceListingSlug
        string guestEmail
        string guestName
        datetime lastMessageAt
        datetime createdAt
        datetime updatedAt
    }

    MessageParticipant {
        int id PK
        int threadId FK
        int partyId FK
        datetime lastReadAt
        datetime createdAt
    }

    Message {
        int id PK
        int threadId FK
        int senderPartyId FK
        string body
        boolean isAutomated
        int automationRuleId
        datetime createdAt
    }

    Campaign ||--o{ CampaignAttribution : "has attributions"
    Campaign }o--|| OffspringGroup : "for group"

    CampaignAttribution }o--|| Offspring : "attributes"

    Template ||--o{ TemplateContent : "has content"
    Template ||--o{ AutoReplyRule : "used by"
    Template }o--|| Party : "created by"

    AutoReplyRule ||--o{ AutoReplyLog : "has logs"

    AutoReplyLog }o--|| Party : "for party"
    AutoReplyLog }o--|| MessageThread : "in thread"

    MessageThread ||--o{ MessageParticipant : "has participants"
    MessageThread ||--o{ Message : "contains"
    MessageThread ||--o{ AutoReplyLog : "has logs"

    MessageParticipant }o--|| Party : "is party"

    Message }o--|| Party : "sent by"

    EmailSendLog }o--|| Invoice : "for invoice"

    Tenant ||--o{ Campaign : "has"
    Tenant ||--o{ Template : "has"
    Tenant ||--o{ AutoReplyRule : "has"
    Tenant ||--o{ EmailSendLog : "has"
    Tenant ||--o{ MessageThread : "has"
```

## DBML

```dbml
// Marketing & Messaging Domain

Table Campaign {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringGroupId int [ref: > OffspringGroup.id]
  name varchar [not null]
  channel CampaignChannel [not null]
  startedAt timestamp
  endedAt timestamp
  budgetCents int
  spendCents int
  impressions int
  clicks int
  inquiries int
  reservations int
  conversions int
  utmSource varchar
  utmMedium varchar
  utmCampaign varchar
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table CampaignAttribution {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  campaignId int [not null, ref: > Campaign.id]
  offspringId int [ref: > Offspring.id]
  weight float
  createdAt timestamp [default: `now()`]
}

Table Template {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  name varchar [not null]
  key varchar
  channel TemplateChannel [not null]
  category TemplateCategory [not null]
  status TemplateStatus [default: 'draft']
  description text
  createdByPartyId int [ref: > Party.id]
  lastUsedAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, key) [unique]
  }
}

Table TemplateContent {
  id int [pk, increment]
  templateId int [not null, ref: > Template.id]
  subject varchar
  bodyText text [not null]
  bodyHtml text
  metadataJson json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table AutoReplyRule {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  channel TemplateChannel [not null]
  enabled boolean [default: true]
  templateId int [not null, ref: > Template.id]
  triggerType AutoReplyTriggerType [not null]
  cooldownMinutes int [default: 60]
  businessHoursJson json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table AutoReplyLog {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  channel TemplateChannel [not null]
  partyId int [not null, ref: > Party.id]
  threadId int [ref: > MessageThread.id]
  ruleId int [ref: > AutoReplyRule.id]
  templateId int
  status AutoReplyStatus [not null]
  reason text
  createdAt timestamp [default: `now()`]
}

Table EmailSendLog {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  to varchar [not null]
  from varchar [not null]
  subject varchar [not null]
  templateKey varchar
  templateId int
  category EmailSendCategory
  provider varchar [default: 'resend']
  providerMessageId varchar
  relatedInvoiceId int [ref: > Invoice.id]
  status EmailSendStatus [default: 'queued']
  error json
  metadata json
  createdAt timestamp [default: `now()`]

  indexes {
    (tenantId, templateKey, relatedInvoiceId) [unique]
  }
}

Table MessageThread {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  subject varchar
  archived boolean [default: false]
  inquiryType varchar
  sourceListingSlug varchar
  guestEmail varchar
  guestName varchar
  lastMessageAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table MessageParticipant {
  id int [pk, increment]
  threadId int [not null, ref: > MessageThread.id]
  partyId int [not null, ref: > Party.id]
  lastReadAt timestamp
  createdAt timestamp [default: `now()`]

  indexes {
    (threadId, partyId) [unique]
  }
}

Table Message {
  id int [pk, increment]
  threadId int [not null, ref: > MessageThread.id]
  senderPartyId int [not null, ref: > Party.id]
  body text [not null]
  isAutomated boolean [default: false]
  automationRuleId int
  createdAt timestamp [default: `now()`]
}

Enum CampaignChannel {
  email
  social
  ads
  marketplace
  website
  other
}

Enum TemplateChannel {
  email
  dm
  social
}

Enum TemplateStatus {
  draft
  active
  archived
}

Enum TemplateCategory {
  auto_reply
  invoice_message
  birth_announcement
  waitlist_update
  general_follow_up
  custom
}

Enum AutoReplyTriggerType {
  dm_first_message_from_party
  dm_after_hours
}

Enum AutoReplyStatus {
  sent
  skipped
  failed
}

Enum EmailSendStatus {
  queued
  sent
  failed
}

Enum EmailSendCategory {
  transactional
  marketing
}
```
