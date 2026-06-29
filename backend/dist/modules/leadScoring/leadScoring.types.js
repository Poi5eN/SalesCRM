export const DEFAULT_RULES = [
    { id: "has_email", label: "Has email", points: 15, condition: "contact.email != null", isActive: true },
    { id: "has_phone", label: "Has phone", points: 10, condition: "contact.phone != null", isActive: true },
    { id: "has_company", label: "Has company", points: 10, condition: "company != null", isActive: true },
    { id: "priority_high", label: "High priority", points: 20, condition: "priority == 'high'", isActive: true },
    { id: "priority_medium", label: "Medium priority", points: 10, condition: "priority == 'medium'", isActive: true },
    { id: "source_referral", label: "Referral source", points: 15, condition: "source == 'referral'", isActive: true },
    { id: "has_close_date", label: "Has expected close date", points: 10, condition: "expectedCloseAt != null", isActive: true },
    { id: "had_communication", label: "Has logged communication", points: 10, condition: "communicationCount > 0", isActive: true },
    { id: "recent_activity", label: "Activity in last 7 days", points: 10, condition: "lastActivityAt > now-7d", isActive: true }
];
