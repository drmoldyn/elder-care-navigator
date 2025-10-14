export interface StateInfo {
  code: string;
  name: string;
  fullName: string;
  narrative: string;
  medicaidInfo: {
    monthlyIncomeLimit: string;
    assetLimit: string;
    applicationProcess: string;
    averageProcessingTime: string;
    helpfulTips: string[];
  };
  resources: {
    ombudsman: { name: string; phone: string; website: string };
    healthDept: { name: string; website: string };
    aging: { name: string; phone: string; website: string };
  };
  averageCosts: {
    dailyRate: string;
    monthlyRange: string;
    context: string;
  };
}

export const US_STATES: Record<string, StateInfo> = {
  TX: {
    code: "TX",
    name: "Texas",
    fullName: "the State of Texas",
    narrative: "Finding the right care for someone you love in Texas can feel overwhelming—you're juggling emotions, logistics, and tough decisions all at once. You're not alone in this journey. Texas is home to hundreds of skilled nursing facilities, assisted living communities, and home health agencies, and while that means you have options, it also means you need reliable information to make the best choice for your loved one.\n\nTexas nursing homes vary widely in quality, staffing levels, and specialty care offerings. Some facilities excel at memory care for those with dementia, while others specialize in short-term rehabilitation after surgery or hospitalization. The good news is that Texas has strong oversight through the Health and Human Services Commission, and you have tools—like SunsetWell scores and CMS ratings—to compare facilities objectively.\n\nRemember: this decision doesn't have to be perfect; it has to be right for your family's unique situation. Trust your instincts during tours, ask questions about staffing ratios and infection control, and know that advocating for your loved one is one of the most compassionate acts you can do.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025)",
      assetLimit: "$2,000 for individuals, $3,000 for couples",
      applicationProcess: "Apply through Your Texas Benefits (YourTexasBenefits.com) or at local Health and Human Services office. You'll need financial documents, medical records, and proof of U.S. citizenship.",
      averageProcessingTime: "45-60 days, though complex cases may take longer",
      helpfulTips: [
        "Start the application early—even before your loved one needs placement—to avoid delays.",
        "Many Texas nursing homes require 90 days of private pay before accepting Medicaid. Ask each facility about their policy.",
        "Work with a Texas elder law attorney to understand spend-down strategies if your loved one's assets exceed the limit.",
        "Veterans may qualify for additional Aid & Attendance benefits to help cover costs during the private-pay period.",
        "Keep detailed records of all medical expenses, as they can sometimes be deducted to help meet Medicaid income requirements.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Texas Long-Term Care Ombudsman",
        phone: "1-800-252-2412",
        website: "https://www.hhs.texas.gov/services/aging/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Texas Health and Human Services Commission",
        website: "https://www.hhs.texas.gov/services/health/long-term-care",
      },
      aging: {
        name: "Texas Area Agencies on Aging",
        phone: "1-800-252-9240",
        website: "https://www.tdhca.state.tx.us/texans-home/aging.htm",
      },
    },
    averageCosts: {
      dailyRate: "$240-$380",
      monthlyRange: "$7,200-$11,400",
      context: "Costs vary significantly by region—urban areas like Houston and Dallas tend to be pricier than rural communities. Short-term rehabilitation may be covered by Medicare for up to 100 days.",
    },
  },
  CA: {
    code: "CA",
    name: "California",
    fullName: "the State of California",
    narrative: "If you're searching for senior care in California, you're likely facing one of life's hardest transitions—and doing so in one of the most expensive states in the country. We see you. This is exhausting, scary, and deeply personal. But you're taking the right steps by researching quality care options, and that matters.\n\nCalifornia has over 1,200 skilled nursing facilities, ranging from large urban centers to smaller community-based homes. The state has some of the nation's strictest quality standards, enforced by the California Department of Public Health. Many facilities specialize in post-acute care, memory care, or rehabilitation services. The diversity of options means you can likely find a facility that matches your loved one's cultural background, language needs, or dietary preferences.\n\nCosts in California are high, often 30-50% above the national average, especially in the Bay Area and Southern California. But Medicaid (called Medi-Cal here) does cover nursing home care for eligible individuals, and many facilities accept it after an initial private-pay period. Don't let cost alone make this decision—quality of care, location near family, and your loved one's comfort matter just as much.",
    medicaidInfo: {
      monthlyIncomeLimit: "$1,732 (2025) for most applicants; higher limits apply for those with high medical expenses",
      assetLimit: "$2,000 for individuals, $3,000 for married couples (with home and one vehicle typically exempt)",
      applicationProcess: "Apply through your county social services office or online at BenefitsCal.com. California has a 'share of cost' system where applicants with income above limits may still qualify by paying a portion toward care.",
      averageProcessingTime: "30-45 days for initial determination, but varies by county",
      helpfulTips: [
        "California allows a 'community spouse' to keep more assets than most states—typically up to $154,140 (2025)—so married applicants should consult an elder law attorney.",
        "Not all California nursing homes accept Medi-Cal. Always confirm acceptance before admission.",
        "California's 'Medi-Cal Estate Recovery Program' may place a claim on the estate after death to recover costs, but exemptions exist—especially if a spouse, disabled child, or caretaker child is involved.",
        "Consider applying for In-Home Supportive Services (IHSS) if your loved one can remain at home with assistance—it's often more affordable than facility care.",
        "Veterans in California may qualify for the VA Aid & Attendance benefit, which can provide up to $2,431/month toward care costs.",
      ],
    },
    resources: {
      ombudsman: {
        name: "California Long-Term Care Ombudsman",
        phone: "1-800-231-4024",
        website: "https://www.aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/",
      },
      healthDept: {
        name: "California Department of Public Health - Licensing & Certification",
        website: "https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/LNCATR.aspx",
      },
      aging: {
        name: "California Department of Aging",
        phone: "1-800-510-2020",
        website: "https://www.aging.ca.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$380-$550",
      monthlyRange: "$11,400-$16,500",
      context: "California has some of the highest nursing home costs in the nation. Coastal and urban areas (SF, LA, San Diego) are most expensive. Rural areas like the Central Valley offer more affordable options. Medicare covers skilled nursing for up to 100 days post-hospitalization; Medi-Cal covers long-term care for eligible residents.",
    },
  },
  NY: {
    code: "NY",
    name: "New York",
    fullName: "the State of New York",
    narrative: "Caring for an aging loved one in New York—whether it's your parent, spouse, or grandparent—means navigating one of the most complex healthcare systems in the country. You're probably feeling exhausted, maybe even guilty for considering facility care. Please know: seeking quality professional care is not giving up. It's often the most loving choice when medical needs outpace what family can safely provide at home.\n\nNew York has hundreds of skilled nursing facilities, many with specialized units for dementia, ventilator care, or post-stroke rehabilitation. The state has strong oversight through the Department of Health, with regular inspections and public complaint records. New York also has one of the more generous Medicaid programs in the nation, covering long-term care for those who qualify—and many facilities here accept Medicaid patients.\n\nWhether you're in New York City, Albany, Buffalo, or a rural area upstate, the challenges are similar: you want quality care, reasonable costs, and a place where your loved one will be treated with dignity. Use the resources below to understand your options, visit multiple facilities in person, and trust that you're doing the best you can with the information and resources you have.",
    medicaidInfo: {
      monthlyIncomeLimit: "$1,732 (2025) but New York is a 'medically needy' state, meaning higher-income individuals can still qualify by 'spending down' to the limit through medical expenses.",
      assetLimit: "$31,175 for individuals (2025), with home and one vehicle typically exempt. Married couples can protect additional assets for the community spouse.",
      applicationProcess: "Apply through your local Department of Social Services or online via myBenefits.ny.gov. You'll need financial documents (bank statements, deeds, life insurance), medical records, and proof of citizenship or legal residency.",
      averageProcessingTime: "45-90 days depending on complexity and county. NYC applications often take longer.",
      helpfulTips: [
        "New York's Medicaid program is relatively applicant-friendly. Work with an elder law attorney to maximize asset protection for a community spouse.",
        "Most New York nursing homes accept Medicaid, but some have waiting lists. Ask about policies during tours.",
        "New York allows a 'Pooled Trust' (also called a Supplemental Needs Trust) for individuals over 65 to shelter excess income while qualifying for Medicaid.",
        "Veterans should apply for VA Aid & Attendance benefits, which can provide up to $2,431/month to offset costs during any private-pay period.",
        "New York does have Medicaid estate recovery, but there are many exemptions—especially if the home is left to a disabled child, caretaker child, or surviving spouse.",
      ],
    },
    resources: {
      ombudsman: {
        name: "New York State Long-Term Care Ombudsman Program",
        phone: "1-855-582-6769",
        website: "https://ombudsman.ny.gov/",
      },
      healthDept: {
        name: "New York State Department of Health - Nursing Home Profile",
        website: "https://profiles.health.ny.gov/nursing_home/",
      },
      aging: {
        name: "New York State Office for the Aging",
        phone: "1-800-342-9871",
        website: "https://aging.ny.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$450-$650",
      monthlyRange: "$13,500-$19,500",
      context: "New York has some of the highest nursing home costs in the U.S., especially in NYC and Long Island. Upstate and rural areas are more affordable. Medicare covers up to 100 days of skilled nursing post-hospitalization. Medicaid covers long-term care for eligible New Yorkers, and the state's relatively generous asset limits help many families qualify.",
    },
  },
  FL: {
    code: "FL",
    name: "Florida",
    fullName: "the State of Florida",
    narrative: "Florida is home to more seniors than almost any other state, which means you're not alone in searching for quality care—but it also means navigating a crowded and sometimes confusing marketplace. Whether your loved one is already a Florida resident or you're considering moving them closer to family in the Sunshine State, this decision is deeply personal and often heartbreaking. You want what's best for them, and you're trying to balance quality, cost, and proximity to family.\n\nFlorida has over 700 skilled nursing facilities, with especially high concentrations in South Florida (Miami, Fort Lauderdale, West Palm Beach), the Tampa Bay area, and Orlando. Many facilities specialize in post-acute rehabilitation, memory care, or long-term ventilator care. Florida's Agency for Health Care Administration inspects facilities regularly, and you can view inspection reports online to see recent deficiencies and how they were corrected.\n\nCosts in Florida vary widely. Urban areas tend to be more expensive, but even within regions, prices can differ by $100/day or more. Medicaid does cover nursing home care in Florida for those who qualify, though many facilities have limited Medicaid beds or require a period of private pay first. Take your time, visit facilities in person, and ask hard questions about staffing, infection control, and how they handle emergencies.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025) for most applicants; Florida uses an 'income cap' rule, but those above the limit can qualify using a Qualified Income Trust (QIT).",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Married couples have spousal protections.",
      applicationProcess: "Apply through the Florida Department of Children and Families (DCF) online at myflorida.com/accessflorida or at a local DCF office. You'll need financial documents, medical records, and proof of residency.",
      averageProcessingTime: "30-60 days, though delays are common if documentation is incomplete.",
      helpfulTips: [
        "Florida uses an 'income cap'—if your loved one's income exceeds $2,829/month, they must establish a Qualified Income Trust (QIT) to qualify for Medicaid. An elder law attorney can help set this up quickly.",
        "Many Florida nursing homes limit the number of Medicaid beds. Ask each facility about their Medicaid policy and waiting lists.",
        "Florida does NOT have Medicaid estate recovery for individuals 55 and older who receive nursing home care—this is unusual and a significant benefit.",
        "Veterans in Florida may qualify for VA Aid & Attendance, which provides up to $2,431/month to help cover costs.",
        "If your loved one owns a home, it's generally exempt from Medicaid's asset limit as long as they intend to return home or a spouse/dependent child lives there.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Florida State Long-Term Care Ombudsman Council",
        phone: "1-888-831-0404",
        website: "http://ombudsman.myflorida.com/",
      },
      healthDept: {
        name: "Florida Agency for Health Care Administration - Nursing Home Guide",
        website: "https://ahca.myflorida.com/MCHQ/Health_Facility_Regulation/Long_Term_Care/index.shtml",
      },
      aging: {
        name: "Florida Department of Elder Affairs",
        phone: "1-800-963-5337",
        website: "https://elderaffairs.org/",
      },
    },
    averageCosts: {
      dailyRate: "$280-$420",
      monthlyRange: "$8,400-$12,600",
      context: "Florida's nursing home costs are near the national average, with higher prices in South Florida and lower prices in rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care, and Florida's lack of estate recovery for nursing home care is a significant benefit for families.",
    },
,
  },
  PA: {
    code: "PA",
    name: "Pennsylvania",
    fullName: "the Commonwealth of Pennsylvania",
    narrative: "If you're searching for nursing home care in Pennsylvania, you're probably carrying a heavy emotional burden right now. Whether you're in Philadelphia, Pittsburgh, or one of Pennsylvania's rural communities, the process of finding quality care for someone you love is never easy. You might be feeling guilty, overwhelmed, or even grieving the loss of independence your loved one is experiencing. These feelings are normal, and you're doing the right thing by researching your options carefully.\n\nPennsylvania has over 700 skilled nursing facilities, regulated by the Department of Health and the Department of Human Services. The state has strong consumer protections, including a robust ombudsman program and public inspection reports. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs like ventilator care or dialysis. Pennsylvania's nursing homes serve diverse communities, including facilities with Yiddish-speaking staff, kosher kitchens, or staff who speak Polish, Italian, or Spanish.\n\nCosts in Pennsylvania are moderate compared to neighboring states like New York and New Jersey, though urban areas are pricier than rural ones. Pennsylvania's Medicaid program covers long-term nursing home care for eligible individuals, and most facilities accept Medicaid—though some require private pay initially. Take your time visiting facilities, ask about staffing ratios during nights and weekends, and trust your gut when you walk through the door.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Pennsylvania uses an income cap, but those above can qualify using a Qualified Income Trust (QIT)",
      assetLimit: "$2,400 for individuals (2025), with home and one vehicle typically exempt",
      applicationProcess: "Apply through your local County Assistance Office or online at COMPASS (compass.state.pa.us). You'll need financial documents, medical assessments, and proof of citizenship.",
      averageProcessingTime: "45-60 days, though complex cases may take longer",
      helpfulTips: [
        "Pennsylvania requires a minimum 30-day private pay period before Medicaid kicks in. Plan ahead financially.",
        "Work with a Pennsylvania elder law attorney to understand spousal protections—PA allows the 'community spouse' to keep significant assets.",
        "Pennsylvania has Medicaid estate recovery, but there are many exemptions—especially if a spouse, disabled child, or caretaker child survives.",
        "Veterans should apply for Aid & Attendance benefits, which can provide up to $2,431/month toward care costs.",
        "If your loved one is under 65, they may qualify for Medicaid more easily under different rules—ask the County Assistance Office.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Pennsylvania Long-Term Care Ombudsman",
        phone: "1-800-356-3606",
        website: "https://www.aging.pa.gov/aging-services/long-term-living/Pages/Ombudsman.aspx",
      },
      healthDept: {
        name: "PA Department of Health - Health Care Facilities",
        website: "https://www.health.pa.gov/topics/facilities/Pages/Nursing-Homes.aspx",
      },
      aging: {
        name: "Pennsylvania Department of Aging",
        phone: "1-717-783-1550",
        website: "https://www.aging.pa.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$320-$480",
      monthlyRange: "$9,600-$14,400",
      context: "Costs vary widely—Philadelphia and Pittsburgh are more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Pennsylvania residents.",
    },
  },
  OH: {
    code: "OH",
    name: "Ohio",
    fullName: "the State of Ohio",
    narrative: "Finding nursing home care in Ohio—whether you're in Cleveland, Columbus, Cincinnati, or a small town in Appalachia—is one of the hardest decisions you'll ever make. You're likely exhausted from caregiving, worried about costs, and maybe even feeling like you're failing your loved one by considering facility care. Please hear this: you are not failing. Seeking professional care when medical needs exceed what you can safely provide at home is an act of love.\n\nOhio has over 950 skilled nursing facilities, making it one of the states with the most options. The Ohio Department of Health inspects facilities regularly, and you can view inspection reports online. Many Ohio nursing homes specialize in Alzheimer's care, post-stroke rehabilitation, or short-term skilled nursing after surgery. Ohio also has a strong network of nonprofit and faith-based facilities, including Catholic, Lutheran, and Jewish-sponsored homes.\n\nCosts in Ohio are below the national average, which can provide some relief during an already stressful time. Ohio's Medicaid program covers nursing home care for those who qualify, and the vast majority of Ohio facilities accept Medicaid patients. Take advantage of Ohio's ombudsman program if you have concerns—they're there to advocate for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Ohio uses an income cap, but those exceeding it can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available for married couples.",
      applicationProcess: "Apply through your county Department of Job and Family Services or online at benefits.ohio.gov. You'll need financial records, medical documentation, and proof of U.S. citizenship or legal residency.",
      averageProcessingTime: "30-45 days for initial determination, longer if documentation is incomplete",
      helpfulTips: [
        "Ohio does NOT require a private-pay period before Medicaid—you can apply for Medicaid immediately upon admission in most cases.",
        "Work with an Ohio elder law attorney to protect assets for a community spouse—Ohio's rules are relatively favorable.",
        "Ohio has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Ohio may qualify for VA Aid & Attendance, providing up to $2,431/month to help with costs.",
        "If your loved one owns a home and intends to return (or a spouse lives there), it's generally exempt from Medicaid's asset limit.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Ohio Long-Term Care Ombudsman Program",
        phone: "1-800-282-1206",
        website: "https://aging.ohio.gov/programs-partners/programs/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Ohio Department of Health - Nursing Homes",
        website: "https://odh.ohio.gov/know-our-programs/health-care-facilities/nursing-homes",
      },
      aging: {
        name: "Ohio Department of Aging",
        phone: "1-866-243-5678",
        website: "https://aging.ohio.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$380",
      monthlyRange: "$7,800-$11,400",
      context: "Ohio's nursing home costs are below the national average. Urban areas (Cleveland, Columbus, Cincinnati) are more expensive than rural counties. Medicare covers up to 100 days of skilled nursing post-hospitalization. Medicaid covers long-term care for eligible Ohioans.",
    },
  },
  IL: {
    code: "IL",
    name: "Illinois",
    fullName: "the State of Illinois",
    narrative: "If you're navigating nursing home placement in Illinois, you're facing one of life's most difficult transitions. Whether you're in Chicago, the suburbs, or downstate communities like Springfield or Peoria, this decision weighs heavily. You might be second-guessing yourself, feeling guilty, or worrying about costs. Know this: you're not alone, and choosing professional care when your loved one needs round-the-clock medical support is responsible and loving.\n\nIllinois has approximately 750 skilled nursing facilities, with particularly high concentrations in the Chicago metro area. The Illinois Department of Public Health regulates these facilities, and inspection reports are publicly available. Many facilities specialize in memory care, ventilator care, or post-acute rehabilitation. Illinois also has culturally specific facilities, including homes with Polish, Greek, or Korean-speaking staff and culturally appropriate meals.\n\nCosts in Illinois are near the national average, with Chicago-area facilities being significantly more expensive than downstate options. Illinois Medicaid (called 'Medical Assistance') covers nursing home care for eligible individuals, though the application process can be complex. Many facilities accept Medicaid, but some have waiting lists or require an initial private-pay period.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Illinois uses an income cap, but applicants above the limit can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal asset protections available.",
      applicationProcess: "Apply through the Illinois Department of Human Services online at abe.illinois.gov or at a local Family Community Resource Center. Bring financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on completeness of application",
      helpfulTips: [
        "Illinois requires Level of Care (LOC) determination before Medicaid approval—your doctor must certify that nursing home care is medically necessary.",
        "Work with an Illinois elder law attorney to navigate spousal impoverishment protections, which can help preserve assets for a community spouse.",
        "Illinois has Medicaid estate recovery, but there are significant exemptions—consult an attorney to understand how this may affect you.",
        "Many Illinois facilities require 60-90 days of private pay before accepting Medicaid. Confirm each facility's policy.",
        "Veterans in Illinois may qualify for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Illinois Long-Term Care Ombudsman Program",
        phone: "1-800-252-8966",
        website: "https://www2.illinois.gov/aging/programs/advocacy/pages/ltcop.aspx",
      },
      healthDept: {
        name: "Illinois Department of Public Health - Nursing Homes",
        website: "https://dph.illinois.gov/topics-services/life-stages-populations/long-term-care.html",
      },
      aging: {
        name: "Illinois Department on Aging",
        phone: "1-800-252-8966",
        website: "https://www2.illinois.gov/aging/",
      },
    },
    averageCosts: {
      dailyRate: "$280-$450",
      monthlyRange: "$8,400-$13,500",
      context: "Illinois nursing home costs vary significantly by region. Chicago and suburbs are most expensive; downstate areas are more affordable. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Illinois residents.",
    },
  },
  MI: {
    code: "MI",
    name: "Michigan",
    fullName: "the State of Michigan",
    narrative: "Searching for nursing home care in Michigan—whether you're in Detroit, Grand Rapids, Ann Arbor, or the Upper Peninsula—is emotionally exhausting. You're probably feeling overwhelmed by choices, worried about quality and costs, and maybe carrying guilt about not being able to care for your loved one at home. First, take a deep breath. You're doing the best you can in a difficult situation, and seeking professional care is often the safest, most compassionate choice.\n\nMichigan has over 400 skilled nursing facilities, regulated by the Michigan Department of Licensing and Regulatory Affairs. Many facilities specialize in memory care, post-surgical rehabilitation, or complex medical needs. Michigan also has culturally diverse facilities, including those serving Arab American, Polish, and African American communities with culturally appropriate care and meals.\n\nCosts in Michigan are near the national average, with Metro Detroit being more expensive than rural areas. Michigan's Medicaid program covers nursing home care for eligible individuals, and most Michigan facilities accept Medicaid—though some require a period of private pay first. Use Michigan's online resources to compare facilities, and don't hesitate to reach out to the ombudsman if you have concerns.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Michigan uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Michigan Department of Health and Human Services at michigan.gov/mdhhs or at a local MDHHS office. You'll need financial documents, medical assessments, and proof of citizenship.",
      averageProcessingTime: "30-60 days depending on application completeness",
      helpfulTips: [
        "Michigan does not require a minimum private-pay period—you can apply for Medicaid immediately upon admission.",
        "Work with a Michigan elder law attorney to understand spousal protections and asset transfers.",
        "Michigan has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Michigan should apply for VA Aid & Attendance benefits, which provide up to $2,431/month.",
        "If your loved one owns a home with the intent to return, it's generally exempt from Medicaid's asset count.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Michigan Long-Term Care Ombudsman Program",
        phone: "1-866-485-9393",
        website: "https://www.michigan.gov/aging/programs/ltcop",
      },
      healthDept: {
        name: "Michigan LARA - Health Facility Licensing",
        website: "https://www.michigan.gov/lara/bureau-list/bhser/health-facility-licensing",
      },
      aging: {
        name: "Michigan Aging and Adult Services Agency",
        phone: "1-517-373-8230",
        website: "https://www.michigan.gov/aging",
      },
    },
    averageCosts: {
      dailyRate: "$280-$400",
      monthlyRange: "$8,400-$12,000",
      context: "Michigan nursing home costs are near the national average. Metro Detroit and Ann Arbor are more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Michigan residents.",
    },
  },
  GA: {
    code: "GA",
    name: "Georgia",
    fullName: "the State of Georgia",
    narrative: "Finding the right nursing home in Georgia—whether you're in Atlanta, Savannah, Augusta, or rural South Georgia—is one of the hardest things you'll ever do. You're probably feeling guilty, overwhelmed, and maybe even heartbroken. Please know: seeking professional care when your loved one needs 24/7 medical support is not giving up. It's making sure they're safe, comfortable, and getting the care they deserve.\n\nGeorgia has over 350 skilled nursing facilities, regulated by the Georgia Department of Community Health. Many facilities specialize in memory care for dementia patients, post-stroke rehabilitation, or complex wound care. Georgia's nursing homes reflect the state's diversity, with facilities serving African American, Hispanic, and Asian communities with culturally appropriate care.\n\nCosts in Georgia are slightly below the national average, which may provide some financial relief. Georgia Medicaid covers nursing home care for eligible individuals, though the application process can be lengthy. Most Georgia facilities accept Medicaid, but many require a period of private pay first—sometimes 90 days or more. Start the Medicaid application early, ask questions during facility tours, and trust your instincts.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Georgia uses an income cap, but applicants above can use a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Georgia Division of Family and Children Services (gateway.ga.gov) or at a local DFCS office. You'll need financial records, medical documentation, and proof of citizenship.",
      averageProcessingTime: "45-90 days, often longer if documentation is incomplete",
      helpfulTips: [
        "Many Georgia nursing homes require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Georgia has strict Medicaid transfer rules—consult an elder law attorney before gifting or transferring assets.",
        "Georgia has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Georgia may qualify for Aid & Attendance benefits, providing up to $2,431/month to help cover costs.",
        "If your loved one owns a home and intends to return, it's generally exempt from Medicaid asset limits.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Georgia Long-Term Care Ombudsman Program",
        phone: "1-866-552-4464",
        website: "https://aging.georgia.gov/long-term-care-ombudsman-program",
      },
      healthDept: {
        name: "Georgia Department of Community Health - Healthcare Facility Regulation",
        website: "https://dch.georgia.gov/divisionsoffices/healthcare-facility-regulation",
      },
      aging: {
        name: "Georgia Division of Aging Services",
        phone: "1-866-552-4464",
        website: "https://aging.georgia.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$240-$360",
      monthlyRange: "$7,200-$10,800",
      context: "Georgia nursing home costs are slightly below the national average. Metro Atlanta is more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Georgia residents.",
    },
  },
  NC: {
    code: "NC",
    name: "North Carolina",
    fullName: "the State of North Carolina",
    narrative: "If you're looking for nursing home care in North Carolina—from Charlotte and Raleigh to the mountains or coast—you're carrying a heavy emotional burden. You might be feeling guilty, scared about costs, or worried about quality. These feelings are completely normal. Choosing nursing home care when your loved one needs professional medical support is not failure—it's love in action.\n\nNorth Carolina has over 400 skilled nursing facilities, regulated by the Division of Health Service Regulation. Many facilities specialize in memory care, post-acute rehabilitation, or ventilator care. North Carolina nursing homes range from large urban centers to smaller community-based facilities, many of which have strong reputations for person-centered care.\n\nCosts in North Carolina are below the national average, which can provide some financial breathing room. North Carolina Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. North Carolina's Community Advisory Committees (CACs) and ombudsman program provide strong resident protections.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); North Carolina uses an income cap, but those above can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through your county Department of Social Services or online at epass.nc.gov. You'll need financial documents, medical assessments, and proof of citizenship.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "North Carolina's 'special income limit' is $2,829/month (2025). If your loved one exceeds this, a Qualified Income Trust (QIT) is required.",
        "Work with a North Carolina elder law attorney to understand spousal asset protections—NC allows community spouses to retain significant resources.",
        "North Carolina has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in NC may qualify for VA Aid & Attendance, providing up to $2,431/month toward care costs.",
        "Many NC facilities require 30-60 days of private pay before accepting Medicaid—confirm policies upfront.",
      ],
    },
    resources: {
      ombudsman: {
        name: "North Carolina Long-Term Care Ombudsman Program",
        phone: "1-800-662-7030",
        website: "https://www.ncdhhs.gov/divisions/daas/services-support/long-term-care-ombudsman",
      },
      healthDept: {
        name: "NC Division of Health Service Regulation",
        website: "https://info.ncdhhs.gov/dhsr/nursinghomes.html",
      },
      aging: {
        name: "North Carolina Division of Aging and Adult Services",
        phone: "1-919-855-3400",
        website: "https://www.ncdhhs.gov/divisions/daas",
      },
    },
    averageCosts: {
      dailyRate: "$260-$380",
      monthlyRange: "$7,800-$11,400",
      context: "North Carolina nursing home costs are below the national average. Urban areas (Charlotte, Raleigh, Durham) are more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible NC residents.",
    },
  },
  NJ: {
    code: "NJ",
    name: "New Jersey",
    fullName: "the State of New Jersey",
    narrative: "Finding nursing home care in New Jersey—whether you're in North Jersey near New York City, Central Jersey, the Shore, or South Jersey near Philadelphia—is overwhelming and heartbreaking. You're probably exhausted from caregiving, worried about the astronomical costs, and maybe feeling like you're abandoning your loved one. Please stop and breathe. Choosing professional care when medical needs exceed what you can safely provide is an act of profound love and responsibility.\n\nNew Jersey has over 350 skilled nursing facilities, regulated by the Department of Health. Many facilities specialize in post-acute care, memory care, or complex medical needs. New Jersey nursing homes serve extraordinarily diverse communities, including facilities with staff speaking Italian, Spanish, Portuguese, Yiddish, Korean, and Gujarati, with culturally appropriate meals and religious services.\n\nCosts in New Jersey are among the highest in the nation—often 40-60% above the national average. This is a harsh reality for families already dealing with emotional strain. New Jersey Medicaid does cover nursing home care for eligible individuals, and most facilities accept Medicaid after an initial private-pay period. Work with an elder law attorney to navigate New Jersey's complex Medicaid rules and protect assets for a community spouse.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); New Jersey uses an income cap, but applicants above can qualify using a Qualified Income Trust (QIT)",
      assetLimit: "$4,000 for individuals (2025)—higher than most states. Community spouse can retain up to $154,140.",
      applicationProcess: "Apply through your county Board of Social Services or online at oneapp.dhs.state.nj.us. You'll need extensive financial documentation, medical records, and proof of citizenship.",
      averageProcessingTime: "60-90 days, often longer in densely populated counties",
      helpfulTips: [
        "New Jersey has a relatively high asset limit ($4,000), which helps more people qualify compared to other states.",
        "Work with a New Jersey elder law attorney—NJ's Medicaid rules are complex, especially regarding spousal protections and asset transfers.",
        "Most NJ facilities require 60-90 days of private pay before accepting Medicaid. Start financial planning early.",
        "New Jersey has Medicaid estate recovery, but many exemptions exist—consult an attorney to understand your situation.",
        "Veterans in NJ may qualify for VA Aid & Attendance, providing up to $2,431/month to help cover costs during private-pay periods.",
      ],
    },
    resources: {
      ombudsman: {
        name: "New Jersey Office of the Long-Term Care Ombudsman",
        phone: "1-877-582-6995",
        website: "https://www.state.nj.us/humanservices/doas/services/ltco/",
      },
      healthDept: {
        name: "New Jersey Department of Health - Healthcare Facility Licensure",
        website: "https://www.nj.gov/health/healthfacilities/",
      },
      aging: {
        name: "New Jersey Division of Aging Services",
        phone: "1-877-222-3737",
        website: "https://www.state.nj.us/humanservices/doas/",
      },
    },
    averageCosts: {
      dailyRate: "$380-$550",
      monthlyRange: "$11,400-$16,500",
      context: "New Jersey has some of the highest nursing home costs in the nation, comparable to New York and California. Northern NJ (near NYC) is most expensive. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible NJ residents.",
    },
  },
  VA: {
    code: "VA",
    name: "Virginia",
    fullName: "the Commonwealth of Virginia",
    narrative: "Searching for nursing home care in Virginia—whether you're in Northern Virginia near DC, Richmond, Hampton Roads, or rural Southwest Virginia—is emotionally and logistically challenging. You're probably feeling guilty about considering facility care, worried about costs, and overwhelmed by options. Please know: you're not failing your loved one. When medical needs require 24/7 professional care, choosing a quality nursing home is responsible and loving.\n\nVirginia has over 280 skilled nursing facilities, regulated by the Department of Health. Many facilities specialize in memory care, post-stroke rehabilitation, or complex wound care. Virginia nursing homes range from large corporate chains to smaller nonprofit and faith-based facilities, many with strong ties to local communities.\n\nCosts in Virginia vary dramatically by region—Northern Virginia and urban areas are expensive (comparable to nearby DC and Maryland), while rural areas are significantly more affordable. Virginia Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid after a private-pay period. Virginia's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Virginia uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through your local Department of Social Services or online at commonhelp.virginia.gov. You'll need financial documents, medical records, and proof of citizenship.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Virginia's income limit is $2,829/month (2025). If your loved one exceeds this, you'll need a Qualified Income Trust (QIT)—an elder law attorney can set this up.",
        "Many Virginia facilities require 30-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Virginia has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Work with a Virginia elder law attorney to understand spousal impoverishment protections—these can help preserve assets for a community spouse.",
        "Veterans in Virginia should apply for VA Aid & Attendance benefits, which provide up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Virginia Long-Term Care Ombudsman Program",
        phone: "1-804-644-2923",
        website: "https://www.vda.virginia.gov/longtermcareombudsman.htm",
      },
      healthDept: {
        name: "Virginia Department of Health - Office of Licensure and Certification",
        website: "https://www.vdh.virginia.gov/health-care-quality-and-compliance/",
      },
      aging: {
        name: "Virginia Department for Aging and Rehabilitative Services",
        phone: "1-800-552-3402",
        website: "https://www.vda.virginia.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$280-$450",
      monthlyRange: "$8,400-$13,500",
      context: "Virginia nursing home costs vary significantly by region. Northern Virginia (Arlington, Fairfax) is most expensive; rural areas are more affordable. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Virginia residents.",
    },
  },
  WA: {
    code: "WA",
    name: "Washington",
    fullName: "the State of Washington",
    narrative: "If you're searching for nursing home care in Washington State—whether in Seattle, Spokane, Tacoma, or smaller communities—you're facing one of life's most difficult transitions. You might be feeling overwhelmed by choices, guilty about not providing care at home, or worried about costs in one of the nation's more expensive states. First, please be kind to yourself. Seeking professional care when your loved one needs round-the-clock medical support is not giving up—it's ensuring they get the specialized care they deserve.\n\nWashington has approximately 210 skilled nursing facilities, regulated by the Department of Social and Health Services. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Washington nursing homes reflect the state's diversity, with facilities offering culturally appropriate care for Asian, Pacific Islander, and Hispanic communities.\n\nCosts in Washington are above the national average, especially in the Seattle metro area. Washington's Medicaid program (called Apple Health) covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Washington has strong consumer protections and a robust ombudsman program to advocate for residents.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Washington uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Generous spousal protections available.",
      applicationProcess: "Apply through the Washington Health Care Authority online at washingtonconnection.org or through your local DSHS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Washington's Medicaid program is relatively applicant-friendly. Work with a Washington elder law attorney to maximize spousal asset protections.",
        "Most Washington facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Washington has Medicaid estate recovery, but many exemptions exist—especially for surviving spouses and disabled children.",
        "Veterans in Washington should apply for VA Aid & Attendance benefits, which provide up to $2,431/month.",
        "If your loved one owns a home and intends to return, it's generally exempt from Medicaid asset limits.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Washington State Long-Term Care Ombudsman Program",
        phone: "1-800-562-6028",
        website: "https://www.waombudsman.org/",
      },
      healthDept: {
        name: "WA Department of Social and Health Services - Residential Care Services",
        website: "https://www.dshs.wa.gov/altsa/residential-care-services",
      },
      aging: {
        name: "Washington Aging and Long-Term Support Administration",
        phone: "1-800-422-3263",
        website: "https://www.dshs.wa.gov/altsa",
      },
    },
    averageCosts: {
      dailyRate: "$340-$480",
      monthlyRange: "$10,200-$14,400",
      context: "Washington nursing home costs are above the national average, with Seattle metro area being most expensive. Rural areas and Eastern Washington offer more affordable options. Medicare covers skilled nursing for up to 100 days post-hospitalization. Apple Health (Medicaid) covers long-term care for eligible Washington residents.",
    },
  },
  MA: {
    code: "MA",
    name: "Massachusetts",
    fullName: "the Commonwealth of Massachusetts",
    narrative: "Finding nursing home care in Massachusetts—whether in Boston, Worcester, Springfield, or Cape Cod—is one of the hardest decisions you'll face. You're probably feeling overwhelmed by the complexity of the healthcare system, guilty about considering facility care, and worried about costs in one of the nation's most expensive states. Please hear this: seeking professional nursing care when your loved one needs 24/7 medical support is an act of love, not abandonment.\n\nMassachusetts has approximately 400 skilled nursing facilities, regulated by the Department of Public Health. Massachusetts nursing homes are known for relatively high quality standards and strong regulatory oversight. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. The state's facilities reflect Massachusetts' diversity, with homes serving Portuguese, Italian, Irish, Chinese, and other communities with culturally appropriate care.\n\nCosts in Massachusetts are among the highest in the nation, often 30-50% above the national average. This financial reality adds stress to an already difficult situation. However, MassHealth (Massachusetts Medicaid) does cover nursing home care for eligible individuals, and most facilities accept MassHealth—though many require a period of private pay first.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Massachusetts uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Community spouse can retain significant assets.",
      applicationProcess: "Apply through MassHealth online at mass.gov/masshealth or through your local MassHealth Enrollment Center. You'll need extensive financial documentation, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days, sometimes longer for complex cases",
      helpfulTips: [
        "Massachusetts has relatively generous spousal protections—work with a Massachusetts elder law attorney to maximize asset retention for a community spouse.",
        "Most Massachusetts facilities require 60-120 days of private pay before accepting MassHealth. Confirm policies upfront.",
        "Massachusetts has MassHealth estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Massachusetts should apply for VA Aid & Attendance benefits, providing up to $2,431/month to help cover costs.",
        "Consider applying for the Massachusetts Senior Care Options (SCO) program if your loved one is eligible for both Medicare and MassHealth.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Massachusetts Long-Term Care Ombudsman Program",
        phone: "1-617-727-7750",
        website: "https://www.mass.gov/orgs/office-of-long-term-care-ombudsman",
      },
      healthDept: {
        name: "Massachusetts Department of Public Health - Health Care Quality",
        website: "https://www.mass.gov/orgs/division-of-health-care-facility-licensure-and-certification",
      },
      aging: {
        name: "Massachusetts Executive Office of Elder Affairs",
        phone: "1-800-243-4636",
        website: "https://www.mass.gov/orgs/executive-office-of-elder-affairs",
      },
    },
    averageCosts: {
      dailyRate: "$400-$580",
      monthlyRange: "$12,000-$17,400",
      context: "Massachusetts has some of the highest nursing home costs in the nation. Greater Boston area is most expensive; Western Massachusetts and Cape Cod vary. Medicare covers skilled nursing for up to 100 days post-hospitalization. MassHealth covers long-term care for eligible Massachusetts residents.",
    },
  },
  AZ: {
    code: "AZ",
    name: "Arizona",
    fullName: "the State of Arizona",
    narrative: "Searching for nursing home care in Arizona—whether in Phoenix, Tucson, Mesa, or smaller communities—often comes during a crisis. Maybe your loved one had a fall, a stroke, or you simply can't provide the level of care they need anymore. You're probably feeling guilty, exhausted, and overwhelmed. Please know: choosing professional nursing care is not giving up. It's making sure your loved one gets the medical support they need to be comfortable and safe.\n\nArizona has approximately 150 skilled nursing facilities, regulated by the Department of Health Services. Many facilities specialize in memory care, post-acute rehabilitation, or ventilator care. Arizona's warm climate attracts retirees from across the country, so you'll find facilities with staff and residents from diverse backgrounds, including strong representation of Hispanic and Native American communities.\n\nCosts in Arizona are near the national average, with urban areas like Phoenix and Scottsdale being more expensive than rural communities. Arizona's Medicaid program (called AHCCCS) covers nursing home care for eligible individuals, though the application process can be complex. Most facilities accept AHCCCS, but many require an initial private-pay period.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Arizona uses an income cap, but applicants exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Arizona Health Care Cost Containment System (AHCCCS) online at healthcurrent.org or through your local DES office. You'll need financial documents, medical assessments, and proof of citizenship.",
      averageProcessingTime: "30-60 days for initial determination",
      helpfulTips: [
        "Arizona's income limit is $2,829/month (2025). If your loved one exceeds this, they'll need a Qualified Income Trust (QIT)—consult an Arizona elder law attorney.",
        "Many Arizona facilities require 30-90 days of private pay before accepting AHCCCS. Confirm policies during tours.",
        "Arizona has AHCCCS estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Arizona may qualify for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Arizona allows 'estate planning' transfers if done more than 5 years before applying—work with an attorney to understand look-back rules.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Arizona State Long-Term Care Ombudsman",
        phone: "1-602-542-4446",
        website: "https://des.az.gov/services/aging-and-adult/adult-protective-services/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Arizona Department of Health Services - Health Care Facility Licensing",
        website: "https://www.azdhs.gov/licensing/",
      },
      aging: {
        name: "Arizona Department of Economic Security - Division of Aging and Adult Services",
        phone: "1-602-542-4446",
        website: "https://des.az.gov/services/aging-and-adult",
      },
    },
    averageCosts: {
      dailyRate: "$260-$380",
      monthlyRange: "$7,800-$11,400",
      context: "Arizona nursing home costs are near the national average. Phoenix and Scottsdale are more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. AHCCCS (Medicaid) covers long-term care for eligible Arizona residents.",
    },
  },
  TN: {
    code: "TN",
    name: "Tennessee",
    fullName: "the State of Tennessee",
    narrative: "If you're looking for nursing home care in Tennessee—whether in Nashville, Memphis, Knoxville, Chattanooga, or rural communities—you're facing one of life's hardest transitions. You might be feeling guilty about not being able to care for your loved one at home, worried about costs, or overwhelmed by choices. Please take a moment to breathe. Seeking professional care when your loved one needs round-the-clock medical support is responsible and loving.\n\nTennessee has over 300 skilled nursing facilities, regulated by the Department of Health. Many facilities specialize in memory care, post-stroke rehabilitation, or complex wound care. Tennessee nursing homes range from large urban centers to smaller community-based facilities with strong local reputations.\n\nCosts in Tennessee are below the national average, which can provide some financial relief during an already stressful time. Tennessee's Medicaid program (called TennCare) covers nursing home care for eligible individuals, and most facilities accept TennCare—though many require a period of private pay first. Tennessee's ombudsman program provides advocacy and support for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Tennessee uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Tennessee Department of Human Services or online at tenncareconnect.tn.gov. You'll need financial documents, medical records, and proof of citizenship.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Tennessee's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Tennessee facilities require 60-90 days of private pay before accepting TennCare. Confirm policies during tours.",
        "Tennessee has TennCare estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Tennessee should apply for VA Aid & Attendance benefits, which provide up to $2,431/month.",
        "Work with a Tennessee elder law attorney to understand spousal asset protections and transfer rules.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Tennessee Long-Term Care Ombudsman Program",
        phone: "1-877-236-0013",
        website: "https://www.tn.gov/aging/our-programs/long-term-care-ombudsman.html",
      },
      healthDept: {
        name: "Tennessee Department of Health - Health Care Facilities",
        website: "https://www.tn.gov/health/health-program-areas/health-professional-boards/hlr-board.html",
      },
      aging: {
        name: "Tennessee Commission on Aging and Disability",
        phone: "1-866-836-6678",
        website: "https://www.tn.gov/aging.html",
      },
    },
    averageCosts: {
      dailyRate: "$240-$340",
      monthlyRange: "$7,200-$10,200",
      context: "Tennessee nursing home costs are below the national average. Urban areas (Nashville, Memphis, Knoxville) are more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. TennCare covers long-term care for eligible Tennessee residents.",
    },
  },
  // Continue with remaining states...
  IN: {
    code: "IN",
    name: "Indiana",
    fullName: "the State of Indiana",
    narrative: "Finding nursing home care in Indiana—whether in Indianapolis, Fort Wayne, Evansville, or smaller communities—is emotionally exhausting. You're probably feeling overwhelmed by options, guilty about considering facility care, and worried about costs. Please know: seeking professional care when your loved one needs 24/7 medical support is not failure. It's ensuring they receive the specialized care they deserve.\n\nIndiana has over 500 skilled nursing facilities, regulated by the State Department of Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Indiana nursing homes range from large corporate chains to smaller nonprofit and faith-based facilities with deep community roots.\n\nCosts in Indiana are below the national average, which may provide some financial relief. Indiana's Medicaid program covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Indiana's ombudsman program provides strong advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Indiana uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals (some counties $1,500), with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Indiana Family and Social Services Administration at fssa.in.gov or at your local Division of Family Resources office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Indiana's asset limit varies by county—some use $2,000, others $1,500. Confirm with your local office.",
        "Many Indiana facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Indiana has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with an Indiana elder law attorney to understand spousal protections and asset transfer rules.",
        "Veterans in Indiana should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Indiana State Long-Term Care Ombudsman",
        phone: "1-800-622-4484",
        website: "https://www.in.gov/aging/long-term-care-ombudsman-program/",
      },
      healthDept: {
        name: "Indiana State Department of Health - Long-Term Care",
        website: "https://www.in.gov/health/hcf/long-term-care/",
      },
      aging: {
        name: "Indiana Division of Aging",
        phone: "1-888-673-0002",
        website: "https://www.in.gov/aging/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$360",
      monthlyRange: "$7,800-$10,800",
      context: "Indiana nursing home costs are below the national average. Indianapolis area is slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medicaid covers long-term care for eligible Indiana residents.",
    },
  },
  MO: {
    code: "MO",
    name: "Missouri",
    fullName: "the State of Missouri",
    narrative: "Searching for nursing home care in Missouri—whether in St. Louis, Kansas City, Springfield, or rural communities—is one of the hardest decisions you'll make. You might be feeling guilty, overwhelmed by choices, or worried about costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs medical support beyond what you can safely provide at home is responsible and loving.\n\nMissouri has approximately 500 skilled nursing facilities, regulated by the Department of Health and Senior Services. Many facilities specialize in memory care, post-acute rehabilitation, or complex wound care. Missouri nursing homes range from large urban centers to smaller community-based facilities, many with strong local reputations for quality care.\n\nCosts in Missouri are below the national average, which can provide financial breathing room. Missouri's Medicaid program (called MO HealthNet) covers nursing home care for eligible individuals, and most facilities accept MO HealthNet—though many require an initial private-pay period. Missouri's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Missouri uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Missouri Department of Social Services at mydss.mo.gov or at your local Family Support Division office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Missouri's income limit is $2,829/month (2025). If your loved one exceeds this, a Qualified Income Trust (QIT) is required—an elder law attorney can help.",
        "Many Missouri facilities require 30-90 days of private pay before accepting MO HealthNet. Confirm policies during tours.",
        "Missouri has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Missouri should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Work with a Missouri elder law attorney to understand spousal asset protections.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Missouri Long-Term Care Ombudsman Program",
        phone: "1-800-309-3282",
        website: "https://health.mo.gov/seniors/ombudsman/",
      },
      healthDept: {
        name: "Missouri Department of Health and Senior Services - Section for Long-Term Care Regulation",
        website: "https://health.mo.gov/safety/longtermcare/",
      },
      aging: {
        name: "Missouri Department of Health and Senior Services - Division of Senior and Disability Services",
        phone: "1-573-751-3082",
        website: "https://health.mo.gov/seniors/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "Missouri nursing home costs are below the national average. St. Louis and Kansas City areas are more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. MO HealthNet covers long-term care for eligible Missouri residents.",
    },
  },
  WI: {
    code: "WI",
    name: "Wisconsin",
    fullName: "the State of Wisconsin",
    narrative: "Finding nursing home care in Wisconsin—whether in Milwaukee, Madison, Green Bay, or rural communities—is overwhelming and heartbreaking. You're probably exhausted from caregiving, worried about costs, and maybe feeling guilty about considering facility care. Please know: you're not failing your loved one. Seeking professional nursing care when medical needs exceed what you can safely provide at home is an act of love.\n\nWisconsin has approximately 380 skilled nursing facilities, regulated by the Department of Health Services. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Wisconsin nursing homes reflect the state's heritage, with facilities serving German, Polish, and Hmong communities with culturally appropriate care and meals.\n\nCosts in Wisconsin are near the national average, with urban areas being somewhat more expensive than rural communities. Wisconsin's Medicaid program (called BadgerCare Plus) covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Wisconsin's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Wisconsin uses an income cap, but those above can qualify with an Income Cap Trust",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through your county's Human Services or Social Services department or online at access.wisconsin.gov. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Wisconsin's Medicaid program is relatively applicant-friendly. Work with a Wisconsin elder law attorney to maximize spousal asset protections.",
        "Many Wisconsin facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Wisconsin has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Wisconsin should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "If your loved one owns a home and intends to return, it's generally exempt from Medicaid asset limits.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Wisconsin Board on Aging and Long-Term Care - Ombudsman Program",
        phone: "1-800-815-0015",
        website: "https://www.advancingaging.org/ombudsman",
      },
      healthDept: {
        name: "Wisconsin Department of Health Services - Division of Quality Assurance",
        website: "https://www.dhs.wisconsin.gov/dqa/index.htm",
      },
      aging: {
        name: "Wisconsin Department of Health Services - Aging and Disability Resources",
        phone: "1-877-222-3737",
        website: "https://www.dhs.wisconsin.gov/aging/index.htm",
      },
    },
    averageCosts: {
      dailyRate: "$280-$400",
      monthlyRange: "$8,400-$12,000",
      context: "Wisconsin nursing home costs are near the national average. Milwaukee and Madison areas are more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. BadgerCare Plus (Medicaid) covers long-term care for eligible Wisconsin residents.",
    },
  },
  MD: {
    code: "MD",
    name: "Maryland",
    fullName: "the State of Maryland",
    narrative: "Searching for nursing home care in Maryland—whether in Baltimore, the DC suburbs, Annapolis, or the Eastern Shore—is emotionally draining. You're probably feeling guilty, overwhelmed by the complexity of the healthcare system, and worried about costs in a relatively expensive state. Please take a breath. Choosing professional nursing care when your loved one needs 24/7 medical support is not abandonment—it's making sure they're safe and getting the specialized care they need.\n\nMaryland has approximately 230 skilled nursing facilities, regulated by the Office of Health Care Quality. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Maryland nursing homes serve diverse communities, including facilities with kosher kitchens, staff speaking Spanish or Korean, and culturally appropriate care.\n\nCosts in Maryland are above the national average, especially in the DC suburbs and Baltimore metro area. Maryland Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require an initial private-pay period. Maryland has strong consumer protections and an active ombudsman program.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Maryland uses an income cap, but those above can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,500 for individuals, with home and one vehicle typically exempt. Generous spousal protections.",
      applicationProcess: "Apply through the Maryland Department of Health or your local Department of Social Services. You can apply online at mydhrbenefits.dhr.state.md.us. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on completeness",
      helpfulTips: [
        "Maryland has relatively generous spousal protections—work with a Maryland elder law attorney to maximize asset retention for a community spouse.",
        "Many Maryland facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Maryland has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Maryland should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Maryland's asset limit ($2,500) is slightly higher than most states, which helps more people qualify.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Maryland Long-Term Care Ombudsman Program",
        phone: "1-800-243-3425",
        website: "https://aging.maryland.gov/Pages/state-long-term-care-ombudsman.aspx",
      },
      healthDept: {
        name: "Maryland Office of Health Care Quality",
        website: "https://health.maryland.gov/ohcq/",
      },
      aging: {
        name: "Maryland Department of Aging",
        phone: "1-800-243-3425",
        website: "https://aging.maryland.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$320-$480",
      monthlyRange: "$9,600-$14,400",
      context: "Maryland nursing home costs are above the national average. DC suburbs (Montgomery, Prince George's counties) and Baltimore metro are most expensive. Medicare covers skilled nursing for up to 100 days post-hospitalization. Maryland Medicaid covers long-term care for eligible residents.",
    },
  },
  MN: {
    code: "MN",
    name: "Minnesota",
    fullName: "the State of Minnesota",
    narrative: "If you're looking for nursing home care in Minnesota—whether in the Twin Cities, Rochester, Duluth, or rural communities—you're facing one of life's most difficult decisions. You might be feeling guilty about not providing care at home, overwhelmed by options, or worried about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs round-the-clock medical support is responsible and compassionate.\n\nMinnesota has approximately 370 skilled nursing facilities, regulated by the Minnesota Department of Health. Minnesota is known for relatively high-quality nursing home care and strong regulatory oversight. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Minnesota nursing homes reflect the state's diversity, including facilities serving Somali, Hmong, and Scandinavian communities with culturally appropriate care.\n\nCosts in Minnesota are near the national average, with the Twin Cities being more expensive than rural areas. Minnesota's Medical Assistance program (Medicaid) covers nursing home care for eligible individuals, and most facilities accept Medical Assistance. Minnesota has strong consumer protections and an active ombudsman program to advocate for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Minnesota uses an income cap, but those above can establish a Qualified Income Trust (QIT)",
      assetLimit: "$3,000 for individuals—higher than most states. Generous spousal protections available.",
      applicationProcess: "Apply through your county Human Services office or online at mn.gov/dhs. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Minnesota's asset limit ($3,000) is higher than most states, making it easier to qualify.",
        "Minnesota does NOT require a private-pay period in many cases—you can apply for Medical Assistance immediately upon admission.",
        "Work with a Minnesota elder law attorney to understand generous spousal asset protections.",
        "Minnesota has Medical Assistance estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Minnesota should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Minnesota Office of Ombudsman for Long-Term Care",
        phone: "1-800-657-3591",
        website: "https://mn.gov/boards-and-commissions/ombudsman-for-long-term-care/",
      },
      healthDept: {
        name: "Minnesota Department of Health - Health Regulation",
        website: "https://www.health.state.mn.us/facilities/regulation/",
      },
      aging: {
        name: "Minnesota Board on Aging",
        phone: "1-800-882-6262",
        website: "https://mn.gov/senior-care/",
      },
    },
    averageCosts: {
      dailyRate: "$300-$420",
      monthlyRange: "$9,000-$12,600",
      context: "Minnesota nursing home costs are near the national average. Twin Cities metro is more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Medical Assistance (Medicaid) covers long-term care for eligible Minnesota residents.",
    },
  },
  CO: {
    code: "CO",
    name: "Colorado",
    fullName: "the State of Colorado",
    narrative: "Finding nursing home care in Colorado—whether in Denver, Colorado Springs, Fort Collins, or mountain communities—is emotionally overwhelming. You're probably feeling guilty about considering facility care, worried about costs in an expensive state, and exhausted from caregiving. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is not giving up. It's ensuring they receive the specialized care they deserve.\n\nColorado has approximately 210 skilled nursing facilities, regulated by the Department of Public Health and Environment. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Colorado nursing homes serve diverse communities, including facilities with Spanish-speaking staff and culturally appropriate care for Hispanic residents.\n\nCosts in Colorado are above the national average, especially in the Denver metro area and resort communities. Colorado's Medicaid program (called Health First Colorado) covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Colorado has strong consumer protections and an active ombudsman program.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Colorado uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Colorado Department of Health Care Policy and Financing at colorado.gov/hcpf or through your county Department of Human Services. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Colorado's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Colorado facilities require 60-90 days of private pay before accepting Health First Colorado. Confirm policies during tours.",
        "Colorado has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Colorado should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Work with a Colorado elder law attorney to understand spousal asset protections.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Colorado Long-Term Care Ombudsman Program",
        phone: "1-800-288-1376",
        website: "https://www.colorado.gov/pacific/cdhs/ltco",
      },
      healthDept: {
        name: "Colorado Department of Public Health and Environment - Health Facilities Division",
        website: "https://cdphe.colorado.gov/health-facilities",
      },
      aging: {
        name: "Colorado Department of Human Services - Aging and Adult Services",
        phone: "1-844-435-3277",
        website: "https://cdhs.colorado.gov/aging-and-adult-services",
      },
    },
    averageCosts: {
      dailyRate: "$300-$450",
      monthlyRange: "$9,000-$13,500",
      context: "Colorado nursing home costs are above the national average. Denver metro and resort areas are most expensive; rural eastern Colorado is more affordable. Medicare covers skilled nursing for up to 100 days post-hospitalization. Health First Colorado (Medicaid) covers long-term care for eligible residents.",
    },
  },
  AL: {
    code: "AL",
    name: "Alabama",
    fullName: "the State of Alabama",
    narrative: "If you're searching for nursing home care in Alabama—whether in Birmingham, Montgomery, Mobile, Huntsville, or rural communities—you're facing one of the hardest decisions of your life. You might be feeling overwhelmed, guilty about not providing care at home, or worried about quality and costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nAlabama has approximately 230 skilled nursing facilities, regulated by the Department of Public Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex wound care. Alabama nursing homes range from large corporate chains to smaller community-based facilities with strong local ties.\n\nCosts in Alabama are below the national average, which can provide some financial relief during a stressful time. Alabama Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Alabama's ombudsman program provides advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Alabama uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Alabama Medicaid Agency online at medicaid.alabama.gov or at your local county Department of Human Resources office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Alabama's income limit is $2,829/month (2025). If your loved one exceeds this, a Qualified Income Trust (QIT) is required—an elder law attorney can help.",
        "Many Alabama facilities require 30-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Alabama has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with an Alabama elder law attorney to understand spousal asset protections.",
        "Veterans in Alabama should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Alabama State Long-Term Care Ombudsman",
        phone: "1-877-425-2243",
        website: "https://alabamaageline.gov/ombudsman/",
      },
      healthDept: {
        name: "Alabama Department of Public Health - Bureau of Health Provider Standards",
        website: "https://www.alabamapublichealth.gov/healthproviderstandards/",
      },
      aging: {
        name: "Alabama Department of Senior Services",
        phone: "1-877-425-2243",
        website: "https://alabamaageline.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "Alabama nursing home costs are below the national average. Urban areas (Birmingham, Huntsville, Montgomery) are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Alabama Medicaid covers long-term care for eligible residents.",
    },
  },
  SC: {
    code: "SC",
    name: "South Carolina",
    fullName: "the State of South Carolina",
    narrative: "Searching for nursing home care in South Carolina—whether in Charleston, Columbia, Greenville, Myrtle Beach, or smaller communities—is emotionally exhausting. You're probably feeling guilty about considering facility care, worried about quality and costs, and overwhelmed by options. Please know: seeking professional nursing care when your loved one needs round-the-clock medical support is an act of love, not failure.\n\nSouth Carolina has approximately 190 skilled nursing facilities, regulated by the Department of Health and Environmental Control. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. South Carolina nursing homes range from large corporate facilities to smaller community-based homes with strong local reputations.\n\nCosts in South Carolina are below the national average, which can provide some financial breathing room. South Carolina Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. South Carolina's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); South Carolina uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the South Carolina Department of Health and Human Services at scdhhs.gov or at your local Department of Social Services office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on application completeness",
      helpfulTips: [
        "South Carolina's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many South Carolina facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "South Carolina has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Work with a South Carolina elder law attorney to understand spousal asset protections.",
        "Veterans in South Carolina should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "South Carolina Long-Term Care Ombudsman Program",
        phone: "1-800-868-9095",
        website: "https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program",
      },
      healthDept: {
        name: "SC Department of Health and Environmental Control - Bureau of Health Facilities Licensing",
        website: "https://scdhec.gov/health-regulations/health-facility-licensing",
      },
      aging: {
        name: "South Carolina Department on Aging",
        phone: "1-800-868-9095",
        website: "https://aging.sc.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$240-$340",
      monthlyRange: "$7,200-$10,200",
      context: "South Carolina nursing home costs are below the national average. Coastal areas and Greenville tend to be more expensive than rural communities. Medicare covers skilled nursing for up to 100 days post-hospitalization. South Carolina Medicaid covers long-term care for eligible residents.",
    },
  },
  LA: {
    code: "LA",
    name: "Louisiana",
    fullName: "the State of Louisiana",
    narrative: "Finding nursing home care in Louisiana—whether in New Orleans, Baton Rouge, Shreveport, Lafayette, or rural parishes—is one of life's hardest transitions. You're probably feeling overwhelmed, guilty about not providing care at home, and worried about quality in a state that has faced significant healthcare challenges. Please know: you're doing your best in a difficult situation. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nLouisiana has approximately 280 skilled nursing facilities, regulated by the Department of Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Louisiana nursing homes reflect the state's unique cultural diversity, including facilities with Cajun and Creole cultural sensitivity.\n\nCosts in Louisiana are below the national average, which can provide some financial relief. Louisiana Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though some require a period of private pay first. Louisiana's ombudsman program provides advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Louisiana uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Louisiana Department of Health at ldh.la.gov or at your local Medicaid office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on completeness",
      helpfulTips: [
        "Louisiana's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Louisiana facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Louisiana has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Louisiana elder law attorney to understand spousal asset protections and transfer rules.",
        "Veterans in Louisiana should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Louisiana Long-Term Care Ombudsman Program",
        phone: "1-866-632-0922",
        website: "http://www.goea.la.gov/programs/ombudsman/",
      },
      healthDept: {
        name: "Louisiana Department of Health - Health Standards Section",
        website: "https://ldh.la.gov/page/health-standards",
      },
      aging: {
        name: "Louisiana Governor's Office of Elderly Affairs",
        phone: "1-866-632-0922",
        website: "http://www.goea.la.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$200-$300",
      monthlyRange: "$6,000-$9,000",
      context: "Louisiana nursing home costs are among the lowest in the nation. New Orleans and Baton Rouge are slightly more expensive than rural parishes. Medicare covers skilled nursing for up to 100 days post-hospitalization. Louisiana Medicaid covers long-term care for eligible residents.",
    },
  },
  KY: {
    code: "KY",
    name: "Kentucky",
    fullName: "the Commonwealth of Kentucky",
    narrative: "If you're searching for nursing home care in Kentucky—whether in Louisville, Lexington, Bowling Green, or rural counties—you're facing one of the hardest decisions you'll ever make. You might be feeling guilty about not providing care at home, overwhelmed by options, or worried about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nKentucky has approximately 280 skilled nursing facilities, regulated by the Cabinet for Health and Family Services. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Kentucky nursing homes range from large corporate chains to smaller nonprofit and faith-based facilities with deep community roots.\n\nCosts in Kentucky are below the national average, which can provide financial relief during an already stressful time. Kentucky Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Kentucky's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Kentucky uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Kentucky Department for Community Based Services at chfs.ky.gov or at your local DCBS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Kentucky's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Kentucky facilities require 30-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Kentucky has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Kentucky elder law attorney to understand spousal asset protections.",
        "Veterans in Kentucky should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Kentucky Long-Term Care Ombudsman",
        phone: "1-800-372-2991",
        website: "https://chfs.ky.gov/agencies/dail/Pages/omb.aspx",
      },
      healthDept: {
        name: "Kentucky Cabinet for Health and Family Services - Office of Inspector General",
        website: "https://chfs.ky.gov/agencies/os/oig/Pages/default.aspx",
      },
      aging: {
        name: "Kentucky Department for Aging and Independent Living",
        phone: "1-502-564-6930",
        website: "https://chfs.ky.gov/agencies/dail/Pages/default.aspx",
      },
    },
    averageCosts: {
      dailyRate: "$240-$340",
      monthlyRange: "$7,200-$10,200",
      context: "Kentucky nursing home costs are below the national average. Louisville and Lexington areas are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Kentucky Medicaid covers long-term care for eligible residents.",
    },
  },
  OR: {
    code: "OR",
    name: "Oregon",
    fullName: "the State of Oregon",
    narrative: "Searching for nursing home care in Oregon—whether in Portland, Salem, Eugene, or smaller communities—is emotionally exhausting. You're probably feeling guilty about considering facility care, worried about costs in an expensive state, and overwhelmed by choices. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is not giving up. It's ensuring they receive the specialized care they deserve.\n\nOregon has approximately 140 skilled nursing facilities, regulated by the Department of Human Services. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Oregon nursing homes serve diverse communities and often emphasize person-centered care and quality of life.\n\nCosts in Oregon are above the national average, especially in the Portland metro area. Oregon's Medicaid program (called Oregon Health Plan) covers nursing home care for eligible individuals, and most facilities accept Oregon Health Plan—though many require a period of private pay first. Oregon has strong consumer protections and an active ombudsman program.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Oregon uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Oregon Department of Human Services at one.oregon.gov or through your local Aging and People with Disabilities office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Oregon's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Oregon facilities require 60-90 days of private pay before accepting Oregon Health Plan. Confirm policies during tours.",
        "Oregon has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Work with an Oregon elder law attorney to understand spousal asset protections.",
        "Veterans in Oregon should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Oregon Long-Term Care Ombudsman",
        phone: "1-800-522-2602",
        website: "https://www.oregon.gov/ltco/",
      },
      healthDept: {
        name: "Oregon Department of Human Services - Aging and People with Disabilities",
        website: "https://www.oregon.gov/dhs/SENIORS-DISABILITIES/Pages/index.aspx",
      },
      aging: {
        name: "Oregon Department of Human Services - Aging and People with Disabilities",
        phone: "1-855-673-2372",
        website: "https://www.oregon.gov/dhs/SENIORS-DISABILITIES/Pages/index.aspx",
      },
    },
    averageCosts: {
      dailyRate: "$300-$440",
      monthlyRange: "$9,000-$13,200",
      context: "Oregon nursing home costs are above the national average. Portland metro area is most expensive; rural areas are more affordable. Medicare covers skilled nursing for up to 100 days post-hospitalization. Oregon Health Plan (Medicaid) covers long-term care for eligible residents.",
    },
  },
  OK: {
    code: "OK",
    name: "Oklahoma",
    fullName: "the State of Oklahoma",
    narrative: "Finding nursing home care in Oklahoma—whether in Oklahoma City, Tulsa, Norman, or rural communities—is one of life's hardest decisions. You might be feeling guilty about not providing care at home, overwhelmed by options, or worried about quality and costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nOklahoma has approximately 300 skilled nursing facilities, regulated by the State Department of Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Oklahoma nursing homes range from large corporate chains to smaller community-based facilities with strong local ties.\n\nCosts in Oklahoma are among the lowest in the nation, which can provide significant financial relief. Oklahoma's Medicaid program (called SoonerCare) covers nursing home care for eligible individuals, and most facilities accept SoonerCare—though some require a period of private pay first. Oklahoma's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Oklahoma uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Oklahoma Health Care Authority at okhca.org or at your local Department of Human Services office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Oklahoma's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Oklahoma facilities require 30-60 days of private pay before accepting SoonerCare. Confirm policies during tours.",
        "Oklahoma has SoonerCare estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with an Oklahoma elder law attorney to understand spousal asset protections.",
        "Veterans in Oklahoma should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Oklahoma State Long-Term Care Ombudsman",
        phone: "1-800-211-2116",
        website: "https://oklahoma.gov/okdhs/services/aging-services/long-term-care-ombudsman.html",
      },
      healthDept: {
        name: "Oklahoma State Department of Health - Protective Health Services",
        website: "https://oklahoma.gov/health/protective-health.html",
      },
      aging: {
        name: "Oklahoma Department of Human Services - Aging Services Division",
        phone: "1-800-211-2116",
        website: "https://oklahoma.gov/okdhs/services/aging-services.html",
      },
    },
    averageCosts: {
      dailyRate: "$180-$280",
      monthlyRange: "$5,400-$8,400",
      context: "Oklahoma has some of the lowest nursing home costs in the nation. Oklahoma City and Tulsa are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. SoonerCare (Medicaid) covers long-term care for eligible Oklahoma residents.",
    },
  },
  CT: {
    code: "CT",
    name: "Connecticut",
    fullName: "the State of Connecticut",
    narrative: "Searching for nursing home care in Connecticut—whether in Hartford, New Haven, Stamford, or smaller towns—is overwhelming and heartbreaking. You're probably feeling guilty about not providing care at home, worried about costs in one of the nation's most expensive states, and exhausted from the caregiving journey. Please take a breath. Seeking professional nursing care when your loved one needs 24/7 medical support is an act of profound love and responsibility.\n\nConnecticut has approximately 215 skilled nursing facilities, regulated by the Department of Public Health. Connecticut is known for relatively high-quality nursing home care and strong regulatory oversight. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Connecticut facilities often reflect the state's diversity, including Italian, Polish, and Hispanic cultural communities.\n\nCosts in Connecticut are among the highest in the nation, often 40-50% above the national average. This financial reality adds stress to an already difficult situation. However, Connecticut Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require an initial private-pay period.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Connecticut uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$1,600 for individuals—lower than most states. Community spouse can retain significant assets.",
      applicationProcess: "Apply through the Connecticut Department of Social Services at ct.gov/dss or at a local DSS office. You'll need extensive financial documentation, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on completeness",
      helpfulTips: [
        "Connecticut's asset limit ($1,600) is lower than most states, but generous spousal protections exist—work with a Connecticut elder law attorney.",
        "Most Connecticut facilities require 90-120 days of private pay before accepting Medicaid. Plan ahead financially.",
        "Connecticut has Medicaid estate recovery, but exemptions exist for surviving spouses, disabled children, and caretaker children.",
        "Veterans in Connecticut should apply for VA Aid & Attendance benefits, providing up to $2,431/month to help during private-pay periods.",
        "Connecticut allows Income Cap Trusts (QIT) for applicants exceeding the income limit—an attorney can establish this quickly.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Connecticut Long-Term Care Ombudsman",
        phone: "1-866-388-1888",
        website: "https://portal.ct.gov/AgingAndDisability/Content-Pages/Programs/Long-Term-Care-Ombudsman",
      },
      healthDept: {
        name: "Connecticut Department of Public Health - Facilities Licensing & Investigations Section",
        website: "https://portal.ct.gov/DPH/Facility-Licensing--Investigations-Section/FLI/Facility-Licensing--Investigations-Section",
      },
      aging: {
        name: "Connecticut Department of Aging and Disability Services",
        phone: "1-860-424-5274",
        website: "https://portal.ct.gov/AgingAndDisability",
      },
    },
    averageCosts: {
      dailyRate: "$420-$600",
      monthlyRange: "$12,600-$18,000",
      context: "Connecticut has some of the highest nursing home costs in the nation. Fairfield County (near NYC) is most expensive; rural areas offer some savings. Medicare covers skilled nursing for up to 100 days post-hospitalization. Connecticut Medicaid covers long-term care for eligible residents.",
    },
  },
  IA: {
    code: "IA",
    name: "Iowa",
    fullName: "the State of Iowa",
    narrative: "Finding nursing home care in Iowa—whether in Des Moines, Cedar Rapids, Davenport, Sioux City, or rural communities—is one of life's most difficult transitions. You might be feeling guilty about not providing care at home, overwhelmed by choices, or worried about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nIowa has approximately 440 skilled nursing facilities, regulated by the Department of Inspections and Appeals. Iowa is known for having many community-based, locally-owned nursing homes with strong ties to their communities. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs.\n\nCosts in Iowa are below the national average, which can provide financial breathing room during a stressful time. Iowa Medicaid covers nursing home care for eligible individuals, and the vast majority of Iowa facilities accept Medicaid. Iowa has a strong ombudsman program to advocate for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Iowa uses an income cap, but those above can qualify with a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Iowa Department of Human Services at dhs.iowa.gov or at your local DHS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Iowa does NOT require a private-pay period—you can apply for Medicaid immediately upon nursing home admission.",
        "Work with an Iowa elder law attorney to understand spousal asset protections.",
        "Iowa has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Iowa should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "If your loved one owns a home and intends to return, it's generally exempt from Medicaid asset limits.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Iowa Office of the State Long-Term Care Ombudsman",
        phone: "1-866-236-1430",
        website: "https://www.iowaaging.gov/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Iowa Department of Inspections and Appeals - Health Facilities Division",
        website: "https://dia.iowa.gov/health-facilities",
      },
      aging: {
        name: "Iowa Department on Aging",
        phone: "1-800-532-3213",
        website: "https://www.iowaaging.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$240-$340",
      monthlyRange: "$7,200-$10,200",
      context: "Iowa nursing home costs are below the national average. Urban areas (Des Moines, Cedar Rapids, Iowa City) are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Iowa Medicaid covers long-term care for eligible residents.",
    },
  },
  AR: {
    code: "AR",
    name: "Arkansas",
    fullName: "the State of Arkansas",
    narrative: "Searching for nursing home care in Arkansas—whether in Little Rock, Fort Smith, Fayetteville, or rural communities—is emotionally overwhelming. You might be feeling guilty about not providing care at home, worried about quality and costs, or exhausted from caregiving. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nArkansas has approximately 230 skilled nursing facilities, regulated by the Office of Long Term Care. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Arkansas nursing homes range from large corporate facilities to smaller community-based homes with strong local roots.\n\nCosts in Arkansas are among the lowest in the nation, which can provide significant financial relief. Arkansas Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though some require a period of private pay first. Arkansas's ombudsman program provides advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Arkansas uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Arkansas Department of Human Services at access.arkansas.gov or at your local DHS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Arkansas's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Arkansas facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Arkansas has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with an Arkansas elder law attorney to understand spousal asset protections.",
        "Veterans in Arkansas should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Arkansas Long-Term Care Ombudsman Program",
        phone: "1-501-682-2441",
        website: "https://humanservices.arkansas.gov/about-dhs/daas/long-term-care-ombudsman-program",
      },
      healthDept: {
        name: "Arkansas Office of Long Term Care",
        website: "https://www.healthy.arkansas.gov/programs-services/topics/office-of-long-term-care",
      },
      aging: {
        name: "Arkansas Division of Aging, Adult, and Behavioral Health Services",
        phone: "1-501-682-2441",
        website: "https://humanservices.arkansas.gov/about-dhs/daas",
      },
    },
    averageCosts: {
      dailyRate: "$180-$280",
      monthlyRange: "$5,400-$8,400",
      context: "Arkansas has some of the lowest nursing home costs in the nation. Little Rock and Northwest Arkansas (Fayetteville, Bentonville) are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Arkansas Medicaid covers long-term care for eligible residents.",
    },
  },
  MS: {
    code: "MS",
    name: "Mississippi",
    fullName: "the State of Mississippi",
    narrative: "Finding nursing home care in Mississippi—whether in Jackson, Gulfport, Southaven, Hattiesburg, or rural communities—is one of life's hardest transitions. You might be feeling overwhelmed, guilty about not providing care at home, or worried about quality in a state that has faced healthcare challenges. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nMississippi has approximately 200 skilled nursing facilities, regulated by the Bureau of Health Facilities Licensure and Certification. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Mississippi nursing homes serve diverse communities, particularly African American families with deep roots in the region.\n\nCosts in Mississippi are among the lowest in the nation, which provides significant financial relief during a difficult time. Mississippi Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. Mississippi's ombudsman program provides advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Mississippi uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Mississippi Division of Medicaid at medicaid.ms.gov or at your local county DHS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-75 days depending on completeness",
      helpfulTips: [
        "Mississippi's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Mississippi facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Mississippi has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Mississippi elder law attorney to understand spousal asset protections.",
        "Veterans in Mississippi should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Mississippi Long-Term Care Ombudsman Program",
        phone: "1-601-359-4929",
        website: "https://www.mdhs.ms.gov/aging-adult-services/programs-services/long-term-care-ombudsman-program/",
      },
      healthDept: {
        name: "Mississippi State Department of Health - Health Facilities Licensure",
        website: "https://msdh.ms.gov/page/31,0,142.html",
      },
      aging: {
        name: "Mississippi Division of Aging and Adult Services",
        phone: "1-800-345-6347",
        website: "https://www.mdhs.ms.gov/aging-adult-services/",
      },
    },
    averageCosts: {
      dailyRate: "$160-$260",
      monthlyRange: "$4,800-$7,800",
      context: "Mississippi has the lowest nursing home costs in the nation. Jackson and coastal areas are slightly more expensive than rural Delta regions. Medicare covers skilled nursing for up to 100 days post-hospitalization. Mississippi Medicaid covers long-term care for eligible residents.",
    },
  },
  KS: {
    code: "KS",
    name: "Kansas",
    fullName: "the State of Kansas",
    narrative: "If you're searching for nursing home care in Kansas—whether in Wichita, Overland Park, Kansas City, Topeka, or rural communities—you're facing one of life's most difficult decisions. You might be feeling guilty, overwhelmed by choices, or worried about costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nKansas has approximately 330 skilled nursing facilities, regulated by the Bureau of Community Health Systems. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Kansas nursing homes range from large urban centers to smaller community-based facilities with strong local ties.\n\nCosts in Kansas are below the national average, which can provide financial breathing room. Kansas Medicaid (called KanCare) covers nursing home care for eligible individuals, and most facilities accept KanCare. Kansas has a strong ombudsman program to advocate for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Kansas uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Kansas Department for Children and Families at kansasbenefits.gov or at your local DCF office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Kansas's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Kansas facilities require 30-60 days of private pay before accepting KanCare. Confirm policies during tours.",
        "Kansas has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Kansas elder law attorney to understand spousal asset protections.",
        "Veterans in Kansas should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Kansas Long-Term Care Ombudsman",
        phone: "1-785-296-3017",
        website: "https://www.kdads.ks.gov/commissions/commission-on-aging/programs/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Kansas Department for Aging and Disability Services - Survey and Certification",
        website: "https://www.kdhe.ks.gov/280/Health-Facilities",
      },
      aging: {
        name: "Kansas Department for Aging and Disability Services",
        phone: "1-785-296-4986",
        website: "https://www.kdads.ks.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "Kansas nursing home costs are below the national average. Wichita and Kansas City metro areas are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. KanCare (Medicaid) covers long-term care for eligible Kansas residents.",
    },
  },
  NV: {
    code: "NV",
    name: "Nevada",
    fullName: "the State of Nevada",
    narrative: "Searching for nursing home care in Nevada—whether in Las Vegas, Reno, Henderson, or smaller communities—is emotionally challenging. You might be feeling guilty about considering facility care, worried about costs, or overwhelmed by options in a state where many people have relocated in retirement. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nNevada has approximately 80 skilled nursing facilities, regulated by the Bureau of Health Care Quality and Compliance. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Nevada nursing homes serve diverse communities, including facilities with Spanish-speaking staff and culturally appropriate care.\n\nCosts in Nevada are near the national average, with Las Vegas and Reno being more expensive than rural areas. Nevada Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Nevada's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Nevada uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Nevada Division of Welfare and Supportive Services at dwss.nv.gov or at your local DWSS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Nevada's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Nevada facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Nevada has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Nevada elder law attorney to understand spousal asset protections.",
        "Veterans in Nevada should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Nevada Aging and Disability Services Division - Ombudsman",
        phone: "1-702-486-3545",
        website: "https://adsd.nv.gov/Programs/Seniors/LTCOP/LTCOProg/",
      },
      healthDept: {
        name: "Nevada Division of Public and Behavioral Health - Bureau of Health Care Quality and Compliance",
        website: "https://dpbh.nv.gov/Programs/CHA/dta/HCQ/Health_Care_Quality_and_Compliance_-_Home/",
      },
      aging: {
        name: "Nevada Aging and Disability Services Division",
        phone: "1-775-687-4210",
        website: "https://adsd.nv.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$380",
      monthlyRange: "$7,800-$11,400",
      context: "Nevada nursing home costs are near the national average. Las Vegas and Reno metro areas are more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Nevada Medicaid covers long-term care for eligible residents.",
    },
  },
  NM: {
    code: "NM",
    name: "New Mexico",
    fullName: "the State of New Mexico",
    narrative: "Finding nursing home care in New Mexico—whether in Albuquerque, Las Cruces, Santa Fe, or rural communities—is emotionally overwhelming. You might be feeling guilty, worried about quality and costs, or exhausted from caregiving. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nNew Mexico has approximately 70 skilled nursing facilities, regulated by the Division of Health Improvement. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. New Mexico nursing homes serve diverse communities, including facilities with Spanish-speaking staff and culturally sensitive care for Hispanic and Native American residents.\n\nCosts in New Mexico are below the national average, which can provide financial relief. New Mexico Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. New Mexico's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); New Mexico uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the New Mexico Human Services Department at yes.state.nm.us or at your local Income Support Division office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "New Mexico's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many New Mexico facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "New Mexico has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a New Mexico elder law attorney to understand spousal asset protections.",
        "Veterans in New Mexico should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "New Mexico Aging and Long-Term Services Department - Ombudsman",
        phone: "1-866-842-9230",
        website: "https://www.nmaging.state.nm.us/long-term-care-ombudsman.aspx",
      },
      healthDept: {
        name: "New Mexico Department of Health - Division of Health Improvement",
        website: "https://www.nmhealth.org/about/dhi/",
      },
      aging: {
        name: "New Mexico Aging and Long-Term Services Department",
        phone: "1-800-432-2080",
        website: "https://www.nmaging.state.nm.us/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "New Mexico nursing home costs are below the national average. Albuquerque and Santa Fe are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. New Mexico Medicaid covers long-term care for eligible residents.",
    },
  },
  WV: {
    code: "WV",
    name: "West Virginia",
    fullName: "the State of West Virginia",
    narrative: "If you're searching for nursing home care in West Virginia—whether in Charleston, Huntington, Morgantown, or rural communities—you're facing one of the hardest decisions of your life. You might be feeling guilty, overwhelmed, or worried about quality and access in a rural state. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nWest Virginia has approximately 120 skilled nursing facilities, regulated by the Office of Health Facility Licensure and Certification. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. West Virginia nursing homes serve close-knit communities, many with strong local reputations for personalized care.\n\nCosts in West Virginia are among the lowest in the nation, which can provide significant financial relief. West Virginia Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. West Virginia's ombudsman program provides advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); West Virginia uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the West Virginia Department of Health and Human Resources at dhhr.wv.gov or at your local DHHR office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "West Virginia's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many West Virginia facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "West Virginia has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a West Virginia elder law attorney to understand spousal asset protections.",
        "Veterans in West Virginia should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "West Virginia Bureau of Senior Services - Long-Term Care Ombudsman",
        phone: "1-304-558-3317",
        website: "https://seniorservices.wv.gov/Pages/LongTermCareOmbudsman.aspx",
      },
      healthDept: {
        name: "WV Office of Health Facility Licensure and Certification",
        website: "https://ohflac.wv.gov/",
      },
      aging: {
        name: "West Virginia Bureau of Senior Services",
        phone: "1-877-987-3646",
        website: "https://seniorservices.wv.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "West Virginia has some of the lowest nursing home costs in the nation. Charleston and Morgantown are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. West Virginia Medicaid covers long-term care for eligible residents.",
    },
  },
  NE: {
    code: "NE",
    name: "Nebraska",
    fullName: "the State of Nebraska",
    narrative: "Searching for nursing home care in Nebraska—whether in Omaha, Lincoln, Grand Island, or rural communities—is emotionally challenging. You might be feeling guilty about not providing care at home, overwhelmed by options, or worried about costs. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nNebraska has approximately 220 skilled nursing facilities, regulated by the Division of Public Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Nebraska nursing homes range from large urban centers to smaller community-based facilities with strong local ties and personalized care.\n\nCosts in Nebraska are below the national average, which can provide financial breathing room. Nebraska Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. Nebraska's ombudsman program provides strong advocacy for residents and families who need support.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Nebraska uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$4,000 for individuals—higher than most states. Spousal protections available.",
      applicationProcess: "Apply through the Nebraska Department of Health and Human Services at dhhs.ne.gov or at your local DHHS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Nebraska's asset limit ($4,000) is higher than most states, making it easier to qualify for Medicaid.",
        "Many Nebraska facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Nebraska has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Nebraska elder law attorney to understand spousal asset protections.",
        "Veterans in Nebraska should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Nebraska State Long-Term Care Ombudsman",
        phone: "1-800-942-7830",
        website: "https://dhhs.ne.gov/Pages/Long-Term-Care-Ombudsman.aspx",
      },
      healthDept: {
        name: "Nebraska Department of Health and Human Services - Regulation and Licensure",
        website: "https://dhhs.ne.gov/licensure/Pages/Licensure.aspx",
      },
      aging: {
        name: "Nebraska Department of Health and Human Services - Division of Aging Services",
        phone: "1-800-942-7830",
        website: "https://dhhs.ne.gov/Pages/Aging-Services.aspx",
      },
    },
    averageCosts: {
      dailyRate: "$240-$340",
      monthlyRange: "$7,200-$10,200",
      context: "Nebraska nursing home costs are below the national average. Omaha and Lincoln are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Nebraska Medicaid covers long-term care for eligible residents.",
    },
  },
  ID: {
    code: "ID",
    name: "Idaho",
    fullName: "the State of Idaho",
    narrative: "Finding nursing home care in Idaho—whether in Boise, Meridian, Idaho Falls, Pocatello, or rural communities—is one of life's most difficult transitions. You might be feeling guilty about not providing care at home, overwhelmed by limited options in rural areas, or worried about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nIdaho has approximately 80 skilled nursing facilities, regulated by the Bureau of Facility Standards. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Idaho nursing homes serve close-knit communities, many with strong local reputations for personalized, compassionate care.\n\nCosts in Idaho are below the national average, which can provide financial relief. Idaho Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though some require a period of private pay first. Idaho's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Idaho uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Idaho Department of Health and Welfare at healthandwelfare.idaho.gov or at your local IDHW office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Idaho's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Idaho facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Idaho has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with an Idaho elder law attorney to understand spousal asset protections.",
        "Veterans in Idaho should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Idaho Commission on Aging - Long-Term Care Ombudsman",
        phone: "1-208-334-3833",
        website: "https://aging.idaho.gov/programs-services/long-term-care-ombudsman/",
      },
      healthDept: {
        name: "Idaho Department of Health and Welfare - Bureau of Facility Standards",
        website: "https://healthandwelfare.idaho.gov/providers/facility-standards-licensing",
      },
      aging: {
        name: "Idaho Commission on Aging",
        phone: "1-877-471-2777",
        website: "https://aging.idaho.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$360",
      monthlyRange: "$7,800-$10,800",
      context: "Idaho nursing home costs are below the national average. Boise metro area is slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Idaho Medicaid covers long-term care for eligible residents.",
    },
  },
  NH: {
    code: "NH",
    name: "New Hampshire",
    fullName: "the State of New Hampshire",
    narrative: "If you're searching for nursing home care in New Hampshire—whether in Manchester, Nashua, Concord, or smaller towns—you're facing one of the hardest decisions you'll ever make. You might be feeling guilty, worried about costs in an expensive state, or overwhelmed by options. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nNew Hampshire has approximately 75 skilled nursing facilities, regulated by the Bureau of Health Facilities Administration. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. New Hampshire nursing homes often emphasize person-centered care and community connections.\n\nCosts in New Hampshire are above the national average, which can add financial stress to an already difficult situation. New Hampshire Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a substantial private-pay period first. New Hampshire's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); New Hampshire uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,500 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the New Hampshire Department of Health and Human Services at dhhs.nh.gov or at your local District Office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "New Hampshire's asset limit ($2,500) is slightly higher than most states, which helps more people qualify.",
        "Many New Hampshire facilities require 90-120 days of private pay before accepting Medicaid. Plan ahead financially.",
        "New Hampshire has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a New Hampshire elder law attorney to understand spousal asset protections.",
        "Veterans in New Hampshire should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "New Hampshire Long-Term Care Ombudsman Program",
        phone: "1-800-442-5640",
        website: "https://www.servicelink.nh.gov/ombudsman/home.htm",
      },
      healthDept: {
        name: "NH Bureau of Health Facilities Administration",
        website: "https://www.dhhs.nh.gov/programs-services/health-facility-licensing",
      },
      aging: {
        name: "New Hampshire Bureau of Elderly and Adult Services",
        phone: "1-603-271-9203",
        website: "https://www.dhhs.nh.gov/programs-services/long-term-supports-services",
      },
    },
    averageCosts: {
      dailyRate: "$340-$480",
      monthlyRange: "$10,200-$14,400",
      context: "New Hampshire nursing home costs are above the national average. Southern NH (near Boston) is most expensive; rural areas are somewhat more affordable. Medicare covers skilled nursing for up to 100 days post-hospitalization. New Hampshire Medicaid covers long-term care for eligible residents.",
    },
  },
  ME: {
    code: "ME",
    name: "Maine",
    fullName: "the State of Maine",
    narrative: "Searching for nursing home care in Maine—whether in Portland, Bangor, Lewiston, or rural communities—is emotionally overwhelming. You might be feeling guilty, worried about access in rural areas, or concerned about costs. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nMaine has approximately 100 skilled nursing facilities, regulated by the Division of Licensing and Certification. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Maine nursing homes often serve close-knit communities with personalized, compassionate care rooted in New England values.\n\nCosts in Maine are near the national average, with southern Maine (near Portland) being more expensive than rural areas. Maine's Medicaid program (called MaineCare) covers nursing home care for eligible individuals, and most facilities accept MaineCare. Maine's ombudsman program provides strong advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Maine uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Maine Department of Health and Human Services at maine.gov/dhhs or at your local DHHS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Maine's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help establish this.",
        "Many Maine facilities require 30-60 days of private pay before accepting MaineCare. Confirm policies during tours.",
        "Maine has MaineCare estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Maine elder law attorney to understand spousal asset protections.",
        "Veterans in Maine should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Maine Long-Term Care Ombudsman Program",
        phone: "1-800-499-0229",
        website: "https://www.maine.gov/dhhs/oads/community-supports/ltco",
      },
      healthDept: {
        name: "Maine Division of Licensing and Certification",
        website: "https://www.maine.gov/dhhs/dlc/",
      },
      aging: {
        name: "Maine Office of Aging and Disability Services",
        phone: "1-207-287-9200",
        website: "https://www.maine.gov/dhhs/oads",
      },
    },
    averageCosts: {
      dailyRate: "$300-$420",
      monthlyRange: "$9,000-$12,600",
      context: "Maine nursing home costs are near the national average. Southern Maine (Portland area) is more expensive than rural northern and coastal areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. MaineCare covers long-term care for eligible Maine residents.",
    },
  },
  RI: {
    code: "RI",
    name: "Rhode Island",
    fullName: "the State of Rhode Island",
    narrative: "Finding nursing home care in Rhode Island—whether in Providence, Warwick, Cranston, or smaller towns—is one of the hardest decisions you'll face. You might be feeling guilty about not providing care at home, worried about costs in an expensive state, or overwhelmed by the healthcare system. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is an act of love and responsibility.\n\nRhode Island has approximately 80 skilled nursing facilities, regulated by the Department of Health. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Rhode Island nursing homes often serve Portuguese, Italian, and Irish communities with culturally appropriate care.\n\nCosts in Rhode Island are above the national average, which adds financial stress to an already difficult situation. Rhode Island Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Rhode Island's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Rhode Island uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$4,000 for individuals—higher than most states. Community spouse can retain significant assets.",
      applicationProcess: "Apply through the Rhode Island Department of Human Services at dhs.ri.gov or at your local DHS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Rhode Island's asset limit ($4,000) is higher than most states, making it easier to qualify for Medicaid.",
        "Work with a Rhode Island elder law attorney to understand generous spousal asset protections.",
        "Many Rhode Island facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies upfront.",
        "Rhode Island has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Rhode Island should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Rhode Island Long-Term Care Ombudsman",
        phone: "1-401-785-3340",
        website: "https://oha.ri.gov/programs-services/long-term-care-ombudsman",
      },
      healthDept: {
        name: "Rhode Island Department of Health - Center for Health Facilities Regulation",
        website: "https://health.ri.gov/programs/detail.php?pgm_id=143",
      },
      aging: {
        name: "Rhode Island Office of Healthy Aging",
        phone: "1-401-462-0740",
        website: "https://oha.ri.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$340-$480",
      monthlyRange: "$10,200-$14,400",
      context: "Rhode Island nursing home costs are above the national average. Providence area is most expensive; rural areas offer limited savings given the state's small size. Medicare covers skilled nursing for up to 100 days post-hospitalization. Rhode Island Medicaid covers long-term care for eligible residents.",
    },
  },
  MT: {
    code: "MT",
    name: "Montana",
    fullName: "the State of Montana",
    narrative: "Searching for nursing home care in Montana—whether in Billings, Missoula, Great Falls, Bozeman, or rural communities—is emotionally challenging and logistically complex. You might be feeling guilty, worried about limited options in rural areas, or concerned about costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nMontana has approximately 90 skilled nursing facilities, regulated by the Quality Assurance Division. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Montana nursing homes often serve close-knit communities with personalized care and strong local connections.\n\nCosts in Montana are near the national average, with urban areas being somewhat more expensive than rural communities. Montana Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. Montana's ombudsman program provides advocacy for residents and families across the state's vast geography.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Montana uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$4,000 for individuals—higher than most states. Spousal protections available.",
      applicationProcess: "Apply through the Montana Department of Public Health and Human Services at dphhs.mt.gov or at your local office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Montana's asset limit ($4,000) is higher than most states, making it easier to qualify for Medicaid.",
        "Many Montana facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Montana has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Montana elder law attorney to understand spousal asset protections.",
        "Veterans in Montana should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Montana Long-Term Care Ombudsman Program",
        phone: "1-800-332-2272",
        website: "https://dphhs.mt.gov/sltc/aging/ombudsman",
      },
      healthDept: {
        name: "Montana Quality Assurance Division",
        website: "https://dphhs.mt.gov/qad",
      },
      aging: {
        name: "Montana Senior and Long-Term Care Division",
        phone: "1-406-444-4077",
        website: "https://dphhs.mt.gov/sltc",
      },
    },
    averageCosts: {
      dailyRate: "$260-$380",
      monthlyRange: "$7,800-$11,400",
      context: "Montana nursing home costs are near the national average. Billings, Missoula, and Bozeman are more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Montana Medicaid covers long-term care for eligible residents.",
    },
  },
  DE: {
    code: "DE",
    name: "Delaware",
    fullName: "the State of Delaware",
    narrative: "If you're searching for nursing home care in Delaware—whether in Wilmington, Dover, Newark, or smaller towns—you're facing one of life's most difficult decisions. You might be feeling guilty about not providing care at home, worried about costs, or overwhelmed by options in a small state. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nDelaware has approximately 50 skilled nursing facilities, regulated by the Office of Health Facilities Licensing and Certification. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Delaware nursing homes often serve close-knit communities with personalized care and strong local reputations.\n\nCosts in Delaware are near the national average, with northern Delaware (near Wilmington and the Pennsylvania border) being more expensive than southern Delaware. Delaware Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Delaware's ombudsman program provides advocacy for residents and families.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Delaware uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Delaware Division of Social Services at dhss.delaware.gov/dhss/dss or at your local DSS office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days for initial determination",
      helpfulTips: [
        "Delaware's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Delaware facilities require 60-90 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Delaware has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Delaware elder law attorney to understand spousal asset protections.",
        "Veterans in Delaware should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Delaware Long-Term Care Ombudsman Program",
        phone: "1-302-674-7364",
        website: "https://dhss.delaware.gov/dhss/dsaapd/ltcop.html",
      },
      healthDept: {
        name: "Delaware Office of Health Facilities Licensing and Certification",
        website: "https://dhss.delaware.gov/dhss/dph/hsp/hsphome.html",
      },
      aging: {
        name: "Delaware Division of Services for Aging and Adults with Physical Disabilities",
        phone: "1-800-223-9074",
        website: "https://dhss.delaware.gov/dhss/dsaapd/",
      },
    },
    averageCosts: {
      dailyRate: "$300-$420",
      monthlyRange: "$9,000-$12,600",
      context: "Delaware nursing home costs are near the national average. Northern Delaware (Wilmington area) is more expensive than Dover and southern Delaware. Medicare covers skilled nursing for up to 100 days post-hospitalization. Delaware Medicaid covers long-term care for eligible residents.",
    },
  },
  SD: {
    code: "SD",
    name: "South Dakota",
    fullName: "the State of South Dakota",
    narrative: "Finding nursing home care in South Dakota—whether in Sioux Falls, Rapid City, Aberdeen, or rural communities—is one of life's hardest transitions. You might be feeling guilty about not providing care at home, worried about limited options in rural areas, or concerned about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nSouth Dakota has approximately 110 skilled nursing facilities, regulated by the Office of Health Care Facilities Licensure and Certification. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. South Dakota nursing homes often serve close-knit communities with personalized care and strong local connections.\n\nCosts in South Dakota are below the national average, which can provide financial relief. South Dakota Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. South Dakota's ombudsman program provides advocacy for residents and families across the state.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); South Dakota uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the South Dakota Department of Social Services at dss.sd.gov or at your local DSS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "South Dakota's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many South Dakota facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "South Dakota has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a South Dakota elder law attorney to understand spousal asset protections.",
        "Veterans in South Dakota should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "South Dakota Long-Term Care Ombudsman Program",
        phone: "1-605-773-3656",
        website: "https://dss.sd.gov/elderlyservices/servicesprograms/ombudsman.aspx",
      },
      healthDept: {
        name: "South Dakota Office of Health Care Facilities Licensure and Certification",
        website: "https://doh.sd.gov/licensing/facilities/",
      },
      aging: {
        name: "South Dakota Department of Social Services - Adult Services and Aging",
        phone: "1-605-773-3165",
        website: "https://dss.sd.gov/elderlyservices/",
      },
    },
    averageCosts: {
      dailyRate: "$220-$320",
      monthlyRange: "$6,600-$9,600",
      context: "South Dakota nursing home costs are below the national average. Sioux Falls and Rapid City are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. South Dakota Medicaid covers long-term care for eligible residents.",
    },
  },
  ND: {
    code: "ND",
    name: "North Dakota",
    fullName: "the State of North Dakota",
    narrative: "Searching for nursing home care in North Dakota—whether in Fargo, Bismarck, Grand Forks, Minot, or rural communities—is emotionally challenging. You might be feeling guilty about considering facility care, worried about limited options in rural areas, or concerned about costs. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nNorth Dakota has approximately 80 skilled nursing facilities, regulated by the Health Facilities Section. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. North Dakota nursing homes often serve close-knit communities with personalized care rooted in Midwestern values.\n\nCosts in North Dakota are below the national average, which can provide financial relief. North Dakota Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. North Dakota's ombudsman program provides advocacy for residents and families across the state.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); North Dakota uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$3,000 for individuals—higher than most states. Spousal protections available.",
      applicationProcess: "Apply through the North Dakota Department of Human Services at nd.gov/dhs or at your local office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "North Dakota's asset limit ($3,000) is higher than most states, making it easier to qualify for Medicaid.",
        "North Dakota does NOT require a private-pay period in many cases—you can apply for Medicaid immediately upon admission.",
        "Work with a North Dakota elder law attorney to understand spousal asset protections.",
        "North Dakota has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in North Dakota should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "North Dakota Long-Term Care Ombudsman",
        phone: "1-800-451-8693",
        website: "https://www.nd.gov/dhs/services/adultsaging/ombudsman.html",
      },
      healthDept: {
        name: "North Dakota Department of Health and Human Services - Health Facilities Section",
        website: "https://www.hhs.nd.gov/licensing",
      },
      aging: {
        name: "North Dakota Department of Health and Human Services - Aging Services Division",
        phone: "1-800-451-8693",
        website: "https://www.nd.gov/dhs/services/adultsaging/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$360",
      monthlyRange: "$7,800-$10,800",
      context: "North Dakota nursing home costs are below the national average. Fargo and Bismarck are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. North Dakota Medicaid covers long-term care for eligible residents.",
    },
  },
  AK: {
    code: "AK",
    name: "Alaska",
    fullName: "the State of Alaska",
    narrative: "Finding nursing home care in Alaska—whether in Anchorage, Fairbanks, Juneau, or remote communities—is uniquely challenging. Alaska's vast geography, limited facilities, and high costs make this transition especially difficult. You might be feeling guilty, worried about limited access, or overwhelmed by the logistics of care in America's largest state. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nAlaska has approximately 15 skilled nursing facilities, primarily concentrated in Anchorage, Fairbanks, and Juneau. These facilities are regulated by the Division of Health Care Services. Many Alaskans face the heartbreaking reality of having to move loved ones far from rural communities to access nursing home care. Alaska nursing homes serve diverse populations, including Alaska Native communities.\n\nCosts in Alaska are among the highest in the nation, often 50-70% above the national average. Alaska's Medicaid program covers nursing home care for eligible individuals, and most facilities accept Medicaid—though availability is extremely limited. Alaska's ombudsman program provides advocacy despite the state's challenging geography.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Alaska uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Alaska Department of Health at dhss.alaska.gov or at your local office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "45-60 days, though remote locations may take longer",
      helpfulTips: [
        "Alaska has very limited nursing home options—many families face difficult decisions about relocating loved ones to urban areas.",
        "Work with an Alaska elder law attorney who understands the unique challenges of Alaska Medicaid.",
        "Alaska has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Alaska should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Consider whether home and community-based services might allow your loved one to remain in their community longer.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Alaska Long-Term Care Ombudsman",
        phone: "1-800-730-6393",
        website: "https://health.alaska.gov/dsds/Pages/ombudsman/default.aspx",
      },
      healthDept: {
        name: "Alaska Division of Health Care Services",
        website: "https://health.alaska.gov/dph/VitalStats/Pages/hcf/default.aspx",
      },
      aging: {
        name: "Alaska Division of Senior and Disabilities Services",
        phone: "1-907-465-3250",
        website: "https://health.alaska.gov/dsds/",
      },
    },
    averageCosts: {
      dailyRate: "$600-$850",
      monthlyRange: "$18,000-$25,500",
      context: "Alaska has the highest nursing home costs in the nation due to remote location, limited facilities, and high operational costs. Anchorage is slightly less expensive than other communities. Medicare covers skilled nursing for up to 100 days post-hospitalization. Alaska Medicaid covers long-term care for eligible residents, but availability is extremely limited.",
    },
  },
  HI: {
    code: "HI",
    name: "Hawaii",
    fullName: "the State of Hawaii",
    narrative: "Searching for nursing home care in Hawaii—whether on Oahu, Maui, the Big Island, or Kauai—comes with unique challenges. Island geography, limited facilities, and high costs make this transition especially difficult. You might be feeling guilty, worried about limited options, or overwhelmed by the logistics. Please be compassionate with yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nHawaii has approximately 50 skilled nursing facilities, primarily concentrated on Oahu. These facilities are regulated by the Office of Health Care Assurance. Many families on neighbor islands face the heartbreaking reality of moving loved ones to Oahu for care. Hawaii nursing homes serve diverse populations, including Native Hawaiian, Japanese, Filipino, and other Asian and Pacific Islander communities.\n\nCosts in Hawaii are among the highest in the nation, often 40-60% above the national average. Hawaii's Medicaid program (called Med-QUEST) covers nursing home care for eligible individuals, and most facilities accept Med-QUEST. Hawaii's ombudsman program provides advocacy across the islands.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Hawaii uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Hawaii Department of Human Services at humanservices.hawaii.gov or at your local DHS office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "45-75 days, with potential delays for outer islands",
      helpfulTips: [
        "Hawaii has limited nursing home options, especially on neighbor islands—many families must relocate loved ones to Oahu.",
        "Work with a Hawaii elder law attorney who understands the unique challenges of island living and Medicaid.",
        "Hawaii has Med-QUEST estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Hawaii should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Consider culturally appropriate facilities that serve your loved one's ethnic community (Japanese, Filipino, Native Hawaiian, etc.).",
      ],
    },
    resources: {
      ombudsman: {
        name: "Hawaii Executive Office on Aging - Long-Term Care Ombudsman",
        phone: "1-808-586-0100",
        website: "https://health.hawaii.gov/eoa/home/programs/",
      },
      healthDept: {
        name: "Hawaii Office of Health Care Assurance",
        website: "https://health.hawaii.gov/opppd/ohca/",
      },
      aging: {
        name: "Hawaii Executive Office on Aging",
        phone: "1-808-586-0100",
        website: "https://health.hawaii.gov/eoa/",
      },
    },
    averageCosts: {
      dailyRate: "$480-$680",
      monthlyRange: "$14,400-$20,400",
      context: "Hawaii has some of the highest nursing home costs in the nation due to island geography and high cost of living. Oahu has more facilities and slightly lower costs than neighbor islands. Medicare covers skilled nursing for up to 100 days post-hospitalization. Med-QUEST (Medicaid) covers long-term care for eligible Hawaii residents.",
    },
  },
  VT: {
    code: "VT",
    name: "Vermont",
    fullName: "the State of Vermont",
    narrative: "If you're searching for nursing home care in Vermont—whether in Burlington, Rutland, Montpelier, or rural towns—you're facing one of life's most difficult decisions. You might be feeling guilty about not providing care at home, worried about limited options in rural areas, or concerned about costs. Please be kind to yourself. Seeking professional nursing care when your loved one needs 24/7 medical support is responsible and compassionate.\n\nVermont has approximately 40 skilled nursing facilities, regulated by the Division of Licensing and Protection. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Vermont nursing homes often emphasize person-centered care and community connections rooted in New England values.\n\nCosts in Vermont are above the national average, which can add financial stress to an already difficult situation. Vermont Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. Vermont's ombudsman program provides strong advocacy for residents and families across the state's rural communities.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Vermont uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt. Spousal protections available.",
      applicationProcess: "Apply through the Vermont Department for Children and Families or Vermont Health Connect at greenmountaincare.org. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Vermont has relatively generous Medicaid policies—work with a Vermont elder law attorney to understand spousal protections.",
        "Many Vermont facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Vermont has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Vermont should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Vermont emphasizes home and community-based services—ask about alternatives if appropriate for your loved one.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Vermont Long-Term Care Ombudsman Project",
        phone: "1-800-642-5119",
        website: "https://vtlegalaid.org/programs/long-term-care-ombudsman-project",
      },
      healthDept: {
        name: "Vermont Division of Licensing and Protection",
        website: "https://dlp.vermont.gov/",
      },
      aging: {
        name: "Vermont Department of Disabilities, Aging and Independent Living",
        phone: "1-802-241-2400",
        website: "https://dail.vermont.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$340-$480",
      monthlyRange: "$10,200-$14,400",
      context: "Vermont nursing home costs are above the national average. Burlington area is most expensive; rural areas offer limited cost savings. Medicare covers skilled nursing for up to 100 days post-hospitalization. Vermont Medicaid covers long-term care for eligible residents.",
    },
  },
  WY: {
    code: "WY",
    name: "Wyoming",
    fullName: "the State of Wyoming",
    narrative: "Finding nursing home care in Wyoming—whether in Cheyenne, Casper, Laramie, Gillette, or rural communities—is uniquely challenging. Wyoming's sparse population, vast distances, and limited facilities make this transition especially difficult. You might be feeling guilty, worried about limited access, or overwhelmed by the logistics of finding quality care. Please know: seeking professional nursing care when your loved one needs 24/7 medical support is responsible and loving.\n\nWyoming has approximately 40 skilled nursing facilities, spread across the state's vast geography. These facilities are regulated by the Office of Healthcare Licensing and Surveys. Many Wyoming families face difficult decisions about relocating loved ones away from rural communities to access nursing home care. Wyoming nursing homes often serve close-knit communities with personalized care.\n\nCosts in Wyoming are below the national average, which can provide financial relief. Wyoming Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid. Wyoming's ombudsman program provides advocacy despite the state's challenging geography and limited facilities.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Wyoming uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Wyoming Department of Health at health.wyo.gov or at your local office. You'll need financial documents, medical assessments, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Wyoming has very limited nursing home options—many rural families must relocate loved ones to larger towns.",
        "Work with a Wyoming elder law attorney to understand spousal asset protections.",
        "Wyoming has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Veterans in Wyoming should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
        "Plan ahead—waiting lists can be significant in Wyoming's limited number of facilities.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Wyoming Long-Term Care Ombudsman Program",
        phone: "1-307-322-5553",
        website: "https://health.wyo.gov/aging/programs/ltcop/",
      },
      healthDept: {
        name: "Wyoming Office of Healthcare Licensing and Surveys",
        website: "https://health.wyo.gov/healthcarelicensing/",
      },
      aging: {
        name: "Wyoming Aging Division",
        phone: "1-307-777-7986",
        website: "https://health.wyo.gov/aging/",
      },
    },
    averageCosts: {
      dailyRate: "$260-$360",
      monthlyRange: "$7,800-$10,800",
      context: "Wyoming nursing home costs are below the national average. Cheyenne and Casper are slightly more expensive than rural areas. Medicare covers skilled nursing for up to 100 days post-hospitalization. Wyoming Medicaid covers long-term care for eligible residents.",
    },
  },
  UT: {
    code: "UT",
    name: "Utah",
    fullName: "the State of Utah",
    narrative: "Searching for nursing home care in Utah—whether in Salt Lake City, Provo, West Valley City, or rural communities—is emotionally challenging. You might be feeling guilty about considering facility care, worried about costs, or overwhelmed by options. Please be compassionate with yourself. Choosing professional nursing care when your loved one needs round-the-clock medical support is responsible and loving.\n\nUtah has approximately 100 skilled nursing facilities, regulated by the Bureau of Health Facility Licensing, Certification, and Resident Assessment. Many facilities specialize in memory care, post-acute rehabilitation, or complex medical needs. Utah nursing homes serve diverse communities, with many facilities emphasizing family involvement and values-based care.\n\nCosts in Utah are below the national average, which can provide financial relief. Utah Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid—though many require a period of private pay first. Utah's ombudsman program provides advocacy for residents and families across the state.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); Utah uses an income cap, but those exceeding it can establish a Qualified Income Trust (QIT)",
      assetLimit: "$2,000 for individuals, with home and one vehicle typically exempt",
      applicationProcess: "Apply through the Utah Department of Health and Human Services at jobs.utah.gov or at your local office. You'll need financial documents, medical records, and citizenship proof.",
      averageProcessingTime: "30-45 days for initial determination",
      helpfulTips: [
        "Utah's income limit is $2,829/month (2025). If exceeded, you'll need a Qualified Income Trust (QIT)—an elder law attorney can help.",
        "Many Utah facilities require 30-60 days of private pay before accepting Medicaid. Confirm policies during tours.",
        "Utah has Medicaid estate recovery, but exemptions exist for surviving spouses and disabled children.",
        "Work with a Utah elder law attorney to understand spousal asset protections.",
        "Veterans in Utah should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "Utah Long-Term Care Ombudsman Program",
        phone: "1-801-538-3910",
        website: "https://daas.utah.gov/long-term-care-ombudsman/",
      },
      healthDept: {
        name: "Utah Bureau of Health Facility Licensing",
        website: "https://deq.utah.gov/division-waste-management-radiation-control/health-facility-licensing",
      },
      aging: {
        name: "Utah Division of Aging and Adult Services",
        phone: "1-877-424-4640",
        website: "https://daas.utah.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$240-$360",
      monthlyRange: "$7,200-$10,800",
      context: "Utah nursing home costs are below the national average. Salt Lake City and Provo areas are slightly more expensive than rural counties. Medicare covers skilled nursing for up to 100 days post-hospitalization. Utah Medicaid covers long-term care for eligible residents.",
    },
  },
  DC: {
    code: "DC",
    name: "Washington, D.C.",
    fullName: "the District of Columbia",
    narrative: "Finding nursing home care in Washington, D.C., is overwhelming in a uniquely challenging urban environment. You're probably feeling exhausted from caregiving, worried about astronomical costs, and maybe feeling like you're abandoning your loved one. Please stop and breathe. Choosing professional care when medical needs exceed what you can safely provide is an act of profound love and responsibility.\n\nWashington, D.C., has approximately 20 skilled nursing facilities, regulated by the Health Regulation and Licensing Administration. Many facilities specialize in post-acute care, memory care, or complex medical needs. D.C. nursing homes serve extraordinarily diverse communities, with facilities offering culturally appropriate care for African American, Hispanic, Asian, and other communities.\n\nCosts in D.C. are among the highest in the nation, often comparable to New York City and San Francisco. D.C. Medicaid covers nursing home care for eligible individuals, and most facilities accept Medicaid after an initial private-pay period. Work with an elder law attorney to navigate D.C.'s complex Medicaid rules and protect assets for a community spouse.",
    medicaidInfo: {
      monthlyIncomeLimit: "$2,829 (2025); D.C. uses an income cap, but applicants above can qualify using a Qualified Income Trust (QIT)",
      assetLimit: "$4,000 for individuals—higher than most jurisdictions. Community spouse can retain significant assets.",
      applicationProcess: "Apply through the D.C. Department of Health Care Finance at dhcf.dc.gov or at a service center. You'll need extensive financial documentation, medical records, and proof of D.C. residency.",
      averageProcessingTime: "60-90 days, often longer due to complex cases",
      helpfulTips: [
        "D.C.'s asset limit ($4,000) is higher than most states, which helps more people qualify.",
        "Work with a D.C. elder law attorney—D.C.'s Medicaid rules are complex and differ from surrounding Maryland and Virginia.",
        "Most D.C. facilities require 60-120 days of private pay before accepting Medicaid. Start financial planning early.",
        "D.C. has Medicaid estate recovery, but exemptions exist—consult an attorney to understand your situation.",
        "Veterans in D.C. should apply for VA Aid & Attendance benefits, providing up to $2,431/month.",
      ],
    },
    resources: {
      ombudsman: {
        name: "District of Columbia Long-Term Care Ombudsman",
        phone: "1-202-434-2140",
        website: "https://dcoa.dc.gov/service/long-term-care-ombudsman-program",
      },
      healthDept: {
        name: "D.C. Health Regulation and Licensing Administration",
        website: "https://dchealth.dc.gov/hrla",
      },
      aging: {
        name: "D.C. Office on Aging",
        phone: "1-202-724-5622",
        website: "https://dcoa.dc.gov/",
      },
    },
    averageCosts: {
      dailyRate: "$420-$600",
      monthlyRange: "$12,600-$18,000",
      context: "Washington, D.C., has some of the highest nursing home costs in the nation, comparable to New York City and San Francisco. Limited facilities and high operational costs drive prices. Medicare covers skilled nursing for up to 100 days post-hospitalization. D.C. Medicaid covers long-term care for eligible residents.",
    },
  },
};

// Helper to get state info
export function getStateInfo(stateCode: string): StateInfo | null {
  return US_STATES[stateCode.toUpperCase()] || null;
}

// Helper to get all state codes
export function getAllStateCodes(): string[] {
  return Object.keys(US_STATES);
}

// Full list of all US states for generation
export const ALL_US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];
