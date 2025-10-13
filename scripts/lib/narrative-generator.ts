/**
 * Generates rich narrative content for metro area pages based on facility data
 */

import type { EnhancedMetroData, MetroNarrative } from '../types/metro-narrative';

interface TierDistribution {
  exceptional: number; // 90+
  excellent: number; // 75-89
  aboveAverage: number; // 60-74
  mixed: number; // 40-59
  lower: number; // 0-39
}

export class NarrativeGenerator {

  /**
   * Calculate tier distribution from facility data
   */
  private getTierDistribution(data: EnhancedMetroData): TierDistribution {
    return {
      exceptional: data.table.filter(f => f.score >= 90).length,
      excellent: data.table.filter(f => f.score >= 75 && f.score < 90).length,
      aboveAverage: data.table.filter(f => f.score >= 60 && f.score < 75).length,
      mixed: data.table.filter(f => f.score >= 40 && f.score < 60).length,
      lower: data.table.filter(f => f.score < 40).length,
    };
  }

  /**
   * Assess overall market quality
   */
  private getQualityAssessment(avgScore: number): {
    level: string;
    description: string;
  } {
    if (avgScore >= 80) return {
      level: 'excellent',
      description: 'exceptional quality with consistently high-performing facilities'
    };
    if (avgScore >= 65) return {
      level: 'good to excellent',
      description: 'strong quality with multiple high-performing options'
    };
    if (avgScore >= 50) return {
      level: 'mixed',
      description: 'variable quality requiring careful evaluation'
    };
    if (avgScore >= 35) return {
      level: 'below average',
      description: 'quality concerns across multiple facilities'
    };
    return {
      level: 'concerning',
      description: 'significant quality challenges throughout the market'
    };
  }

  /**
   * Generate market overview section
   */
  private generateMarketOverview(data: EnhancedMetroData): MetroNarrative['marketOverview'] {
    const avgScore = parseFloat(data.averageScore);
    const quality = this.getQualityAssessment(avgScore);
    const tiers = this.getTierDistribution(data);
    const topFacilities = data.table.slice(0, 3);
    const hasLowScorers = tiers.lower > 0;
    const scoreRange = data.table.length > 0
      ? data.table[0].score - data.table[data.table.length - 1].score
      : 0;

    // Build quality landscape in parts to avoid complex template literals
    let qualityLandscape = `${data.city}'s skilled nursing landscape shows ${quality.description}. With ${data.count} facilities averaging a SunsetWell score of ${avgScore.toFixed(1)}, families have ${data.count < 10 ? 'limited but focused' : data.count < 20 ? 'moderate' : 'extensive'} options to consider. ${data.highPerformerShare}% of facilities score 75 or higher, indicating ${data.highPerformerShare >= 40 ? 'strong' : data.highPerformerShare >= 20 ? 'moderate' : 'limited'} availability of high-performing care.\n\n`;

    if (topFacilities.length > 0) {
      qualityLandscape += `The market is led by ${topFacilities[0].title} (score: ${topFacilities[0].score}), which ranks in the ${topFacilities[0].percentile}th percentile among peer facilities. `;
      if (topFacilities.length > 1) {
        const secondFacility = topFacilities[1];
        qualityLandscape += `${secondFacility.title} (${secondFacility.score})`;
        if (topFacilities.length > 2) {
          qualityLandscape += ` and ${topFacilities[2].title} (${topFacilities[2].score}) provide`;
        } else {
          qualityLandscape += ' provides';
        }
        qualityLandscape += ' additional quality options for families seeking excellence.';
      }
      qualityLandscape += '\n\n';
    }

    if (hasLowScorers) {
      const facilityWord = tiers.lower === 1 ? 'facility scores' : 'facilities score';
      qualityLandscape += `However, ${tiers.lower} ${facilityWord} below 40, indicating significant quality concerns. The ${scoreRange}-point gap between highest and lowest-rated facilities highlights the importance of thorough evaluation.`;
    } else {
      qualityLandscape += 'Quality is relatively consistent across the market, though families should still verify current inspection reports and tour facilities personally.';
    }
    const supplyDemand = data.count < 10
      ? `${data.city} has a relatively small skilled nursing market with just ${data.count} facilities. This limited supply means that top-performing facilities often maintain waitlists of 2-6 months, particularly for private-pay residents. Families should start the application process early and consider expanding their search to nearby metro areas if immediate placement is needed.`
      : data.count < 20
      ? `With ${data.count} skilled nursing facilities, ${data.city} offers moderate choice for families. Top-tier facilities (scores 75+) typically have 1-3 month waitlists, while mid-tier options may have immediate availability. Early planning is advisable for quality-focused placements.`
      : `${data.city}'s ${data.count} skilled nursing facilities provide families with extensive options. While top performers may have waitlists, the market size generally ensures placement opportunities across quality tiers. Competition among facilities can benefit families through better service and competitive pricing.`;

    const regionalTrends = this.generateRegionalTrends(data, tiers);
    const medicaidAccess = this.generateMedicaidAccess(data, tiers);

    return {
      qualityLandscape,
      supplyDemand,
      regionalTrends,
      medicaidAccess,
    };
  }

  /**
   * Generate regional trends narrative
   */
  private generateRegionalTrends(data: EnhancedMetroData, tiers: TierDistribution): string {
    const avgScore = parseFloat(data.averageScore);

    // State-specific characteristics
    const stateContext: Record<string, string> = {
      'CA': 'California\'s stringent state regulations and higher staffing minimums generally result in better quality metrics, though costs tend to be 30-50% above national averages.',
      'OR': 'Oregon facilities benefit from strong state oversight and community-based care initiatives, though smaller markets like Portland face capacity constraints.',
      'WA': 'Washington state\'s progressive healthcare policies and high minimum wage standards contribute to strong staffing levels but elevated costs.',
      'MD': 'Maryland\'s proximity to federal healthcare centers and robust state inspection programs typically produce above-average quality outcomes.',
      'TX': 'Texas\' less stringent regulatory environment creates variable quality across markets, making careful facility evaluation essential.',
      'FL': 'Florida\'s large senior population drives competition among facilities, with quality varying significantly between tourist areas and rural regions.',
      'PA': 'Pennsylvania\'s mix of urban and rural facilities shows significant quality variation, with Philadelphia and Pittsburgh metros generally outperforming smaller markets.',
      'NY': 'New York\'s strict state regulations and high labor costs create market pressure, resulting in both premium options and budget facilities with quality concerns.',
    };

    const stateInfo = stateContext[data.state] || `${data.state} offers a range of skilled nursing options with quality varying by location and ownership structure.`;

    return `${stateInfo}

${data.city}'s market reflects ${avgScore >= 65 ? 'these positive regional characteristics' : avgScore >= 50 ? 'mixed regional dynamics with both strong performers and facilities facing challenges' : 'regional challenges common in competitive healthcare markets'}. ${tiers.exceptional + tiers.excellent >= 3 ? `The presence of ${tiers.exceptional + tiers.excellent} high-performing facilities demonstrates that quality care is achievable in this market.` : tiers.exceptional + tiers.excellent > 0 ? `While top-tier options exist, families may need to balance quality preferences with availability and location convenience.` : 'Families may want to consider expanding their search radius to access higher-quality facilities in neighboring markets.'}`;
  }

  /**
   * Generate Medicaid access narrative
   */
  private generateMedicaidAccess(data: EnhancedMetroData, tiers: TierDistribution): string {
    // Estimate Medicaid acceptance based on scores (lower-scoring facilities typically accept more Medicaid)
    const likelyMedicaidFacilities = tiers.mixed + tiers.lower;
    const limitedMedicaidFacilities = Math.ceil(tiers.aboveAverage * 0.3);
    const totalMedicaidEstimate = likelyMedicaidFacilities + limitedMedicaidFacilities;

    if (totalMedicaidEstimate === 0) {
      return `${data.city} appears to have limited Medicaid acceptance among tracked facilities. Families requiring Medicaid coverage should contact facilities directly to verify bed availability, as acceptance policies change frequently. Consider consulting with ${data.state} Department of Health and Human Services for Medicaid-certified facility listings.`;
    }

    return `Approximately ${totalMedicaidEstimate} of ${data.count} facilities likely accept Medicaid residents, though acceptance varies by facility and bed availability. Higher-scoring facilities (75+) typically limit Medicaid beds to 10-30% of capacity, while lower-tier facilities may accept 60-80% Medicaid residents.

${data.state} Medicaid eligibility requires assets below $2,000 for individuals ($3,000 for couples in some states), with a 45-60 day application process. Families should apply to multiple facilities simultaneously, as Medicaid bed waitlists can extend 2-6 months at preferred facilities. Facilities scoring 60+ with Medicaid acceptance offer the best balance of quality and accessibility.`;
  }

  /**
   * Generate cost analysis section
   */
  private generateCostAnalysis(data: EnhancedMetroData, tiers: TierDistribution): MetroNarrative['costAnalysis'] {
    // State-based cost estimates (national averages from Genworth 2024)
    const stateCosts: Record<string, number> = {
      'CA': 450, 'NY': 480, 'MA': 460, 'CT': 470, 'WA': 410,
      'OR': 380, 'MD': 370, 'PA': 350, 'IL': 330, 'TX': 280,
      'FL': 320, 'AZ': 300, 'NC': 290, 'GA': 300, 'VA': 340,
      'OH': 280, 'MI': 300, 'TN': 270, 'MO': 260, 'OK': 240,
    };

    const baseRate = stateCosts[data.state] || 320;
    const avgScore = parseFloat(data.averageScore);

    // Adjust based on metro size and quality
    const sizeMultiplier = data.count < 10 ? 1.1 : data.count < 20 ? 1.05 : 1.0;
    const qualityMultiplier = avgScore >= 70 ? 1.15 : avgScore >= 55 ? 1.05 : 0.95;
    const adjustedRate = Math.round(baseRate * sizeMultiplier * qualityMultiplier);

    return {
      averageDailyRate: adjustedRate,
      priceRangeByTier: {
        exceptional: tiers.exceptional > 0 ? `$${Math.round(adjustedRate * 1.8)}-${Math.round(adjustedRate * 2.2)}/day` : 'N/A',
        excellent: tiers.excellent > 0 ? `$${Math.round(adjustedRate * 1.4)}-${Math.round(adjustedRate * 1.7)}/day` : 'N/A',
        aboveAverage: tiers.aboveAverage > 0 ? `$${Math.round(adjustedRate * 1.0)}-${Math.round(adjustedRate * 1.3)}/day` : 'N/A',
        mixed: tiers.mixed > 0 ? `$${Math.round(adjustedRate * 0.8)}-${Math.round(adjustedRate * 1.0)}/day` : 'N/A',
        lower: tiers.lower > 0 ? `$${Math.round(adjustedRate * 0.7)}-${Math.round(adjustedRate * 0.9)}/day` : 'N/A',
      },
      monthlyEstimate: `$${Math.round(adjustedRate * 0.8 * 30).toLocaleString()}-${Math.round(adjustedRate * 2.2 * 30).toLocaleString()}/month`,
      stateComparison: adjustedRate > baseRate * 1.1 ? 'Above state average' : adjustedRate < baseRate * 0.9 ? 'Below state average' : 'Comparable to state average',
      fundingOptions: this.getFundingOptions(data.state),
    };
  }

  /**
   * Get state-specific funding options
   */
  private getFundingOptions(state: string): string[] {
    return [
      'Medicare: Covers up to 100 days post-hospitalization (days 1-20 fully covered, days 21-100 with copay)',
      `${state} Medicaid: Covers long-term care for eligible residents with assets below $2,000`,
      'Long-Term Care Insurance: Most facilities accept major LTC policies',
      'Veterans Aid & Attendance: Up to $2,431/month for eligible veterans (2024 rates)',
      'Private Pay: Personal savings, home equity, or family support',
      'Life Insurance Conversion: Some policies allow accelerated death benefits',
    ];
  }

  /**
   * Generate decision framework
   */
  private generateDecisionFramework(data: EnhancedMetroData): MetroNarrative['decisionFramework'] {
    const topTier = data.table.filter(f => f.score >= 75);
    const medicaidTier = data.table.filter(f => f.score >= 40 && f.score < 75);
    const urgentTier = data.table.filter(f => f.score >= 60);
    const budgetTier = data.table.filter(f => f.score >= 50);

    return {
      qualityPriority: {
        recommendation: topTier.length > 0
          ? `Choose from ${data.city}'s top-rated facilities`
          : 'Consider expanding search to nearby metros for premium options',
        facilities: topTier.slice(0, 3).map(f => f.title),
        reasoning: topTier.length > 0
          ? `These facilities score 75+ and demonstrate consistent excellence in health inspections, staffing, and quality measures. Worth the waitlist and premium pricing for peace of mind.`
          : `${data.city}'s current market lacks facilities scoring 75+. Nearby metros may offer better quality options worth the additional travel distance.`,
      },
      medicaidNeeded: {
        recommendation: medicaidTier.length > 0
          ? 'Apply to multiple mid-tier facilities simultaneously'
          : 'Contact facilities directly to verify Medicaid bed availability',
        facilities: medicaidTier.slice(0, 3).map(f => f.title),
        reasoning: medicaidTier.length > 0
          ? 'These facilities likely accept Medicaid while maintaining adequate quality scores (40-74). Balance of accessibility and care standards.'
          : 'Limited options with quality scores in Medicaid-accepting range. Thorough facility tours essential.',
        waitlistInfo: medicaidTier.length >= 5
          ? 'Medicaid waitlists typically 1-3 months; apply early'
          : 'Limited Medicaid capacity may result in 3-6 month waitlists',
      },
      urgentPlacement: {
        recommendation: urgentTier.length > 0
          ? 'Contact these facilities first for fastest placement'
          : 'Consider temporary respite care while waitlisted',
        facilities: urgentTier.slice(0, 3).map(f => f.title),
        alternatives: urgentTier.length < 3
          ? `Expand search to nearby cities or consider temporary respite placement at higher-quality facilities while waiting for permanent openings.`
          : `Mid-tier facilities typically have 1-2 week availability. Push back on hospital discharge pressure to ensure adequate facility evaluation.`,
      },
      budgetConstrained: {
        recommendation: budgetTier.length > 0
          ? 'Focus on these value options with reasonable quality'
          : 'Explore state financial assistance programs',
        facilities: budgetTier.slice(0, 3).map(f => f.title),
        costSavingTips: [
          'Start with Medicare: Use 100-day Medicare benefit before transitioning to private pay',
          'Choose semi-private rooms: Save $1,500-4,500/month vs. private',
          'Apply for Medicaid early: 45-60 day process; plan ahead',
          'Check VA benefits: Veterans may qualify for Aid & Attendance',
          'Consult elder law attorney: Medicaid planning can preserve assets',
        ],
      },
    };
  }

  /**
   * Generate FAQs
   */
  private generateFAQs(data: EnhancedMetroData, tiers: TierDistribution): MetroNarrative['faqs'] {
    const avgScore = parseFloat(data.averageScore);
    const topFacility = data.table[0];
    const medicaidCount = tiers.mixed + tiers.lower;

    return [
      {
        question: `How long are waitlists at top ${data.city} facilities?`,
        answer: topFacility && topFacility.score >= 90
          ? `Premium facilities like ${topFacility.title} typically have 3-4 month waitlists for standard admission, 1-2 months for Medicare rehab. Mid-tier facilities (scores 60-74) usually have 1-3 week waits. Lower-tier facilities often have immediate openings.`
          : topFacility && topFacility.score >= 75
          ? `Top facilities like ${topFacility.title} usually have 2-3 month waitlists. Mid-tier options (scores 60-74) typically have 2-4 week availability. Apply early to multiple facilities.`
          : `${data.city}'s facilities generally have shorter waitlists due to market conditions. Most facilities can accommodate placements within 1-3 weeks, though quality evaluation remains essential.`,
        category: 'waitlist',
      },
      {
        question: `Which ${data.city} nursing homes accept Medicaid?`,
        answer: medicaidCount > 0
          ? `Approximately ${medicaidCount} facilities likely accept Medicaid residents, typically those scoring 40-70. Higher-scoring facilities may have limited Medicaid beds (10-30% capacity). Lower-scoring facilities often accept 60-80% Medicaid. Contact facilities directly to verify current bed availability, as policies change frequently. ${data.state} Medicaid requires assets below $2,000 with 45-60 day application process.`
          : `${data.city} has limited Medicaid acceptance among tracked facilities. Contact ${data.state} Department of Health and Human Services for complete Medicaid-certified facility listings. Consider facilities in nearby areas if local options are limited.`,
        category: 'medicaid',
      },
      {
        question: `What makes ${topFacility?.title || data.city + "'s top facility"} worth the cost?`,
        answer: topFacility && topFacility.score >= 85
          ? `${topFacility.title}'s ${topFacility.score} score reflects ${topFacility.health === 5 ? 'perfect 5-star health inspections' : topFacility.health === 4 ? 'excellent 4-star health ratings' : 'strong health compliance'}, ${topFacility.staffing === 5 ? 'exceptional staffing levels' : topFacility.staffing === 4 ? 'above-average staffing' : 'adequate staffing'}, and ${topFacility.quality === 5 ? 'superior quality measures' : topFacility.quality === 4 ? 'excellent resident outcomes' : 'solid quality performance'}. Premium pricing buys clinical excellence, experienced staff, better amenities, and peace of mind. However, only pay premium prices if financially sustainable without creating hardship.`
          : topFacility
          ? `${topFacility.title} scores ${topFacility.score}, representing the best available option in ${data.city}. While not premium-tier, it offers reliable quality with ${topFacility.health ? topFacility.health + '-star health rating' : 'documented quality metrics'} and ${topFacility.staffing ? topFacility.staffing + '-star staffing' : 'acceptable staffing levels'}.`
          : `${data.city}'s facilities show variable quality. Carefully evaluate inspection reports, staffing levels, and resident outcomes before making decisions. Consider nearby markets for additional options.`,
        category: 'quality',
      },
      {
        question: 'What should I look for during facility tours?',
        answer: `When visiting facilities, many families find it helpful to observe how staff interact with residents throughout the day. You might notice whether staff members are attentive and kind, or if they seem rushed and impersonal. It's also worth paying attention to how residents look and whether they appear clean, well-groomed, and engaged in their surroundings. The overall atmosphere can tell you a lot—some families watch for whether the facility feels fresh and well-maintained or if there are concerning odors. Things to watch for that can help you feel more confident in your choice include seeing residents participating in activities, observing clean common areas and resident rooms, and getting straightforward answers when you ask about staffing levels. ${tiers.lower > 0 ? `You may want to be more cautious with facilities that have 1-2 star health inspections—${data.city} has ${tiers.lower} facilities in this range.` : 'Some families become concerned when a facility has immediate availability while others have waitlists, or if staff seem evasive when discussing their inspection history.'} Many families choose to visit at different times of day, including evenings and weekends, to get a fuller picture of daily life at the facility.`,
        category: 'quality',
      },
      {
        question: `What if I need urgent placement in ${data.city} today?`,
        answer: data.table.filter(f => f.score >= 60).length > 0
          ? `Best immediate options: Contact ${data.table.filter(f => f.score >= 60).slice(0, 2).map(f => f.title).join(' and ')} first - usually 1-2 week availability with decent quality. If unavailable, expand search to nearby metros or use temporary respite care while waiting for preferred facility openings. Push back on hospital discharge pressure - don't accept first available facility without evaluation. Contact ${data.state} Senior Services hotline for urgent placement assistance.`
          : `${data.city} has limited immediate high-quality options. Strategies: (1) Expand search radius to nearby cities, (2) Request temporary respite care at better facilities while waitlisted, (3) Contact ${data.state} Area Agency on Aging for emergency placement assistance, (4) Don't rush into low-scoring facilities - quality matters even in emergencies.`,
        category: 'placement',
      },
      {
        question: `How much does nursing home care cost in ${data.city}?`,
        answer: this.generateCostFAQ(data),
        category: 'cost',
      },
      {
        question: 'How do I pay for long-term nursing home care?',
        answer: `Many families navigate nursing home costs by using a combination of funding sources. Medicare can cover up to 100 days following a hospitalization for skilled nursing care, which gives families time to plan for longer-term arrangements. For ongoing care, ${data.state} Medicaid can help cover costs if your loved one's assets are below $2,000, though the application process typically takes 45-60 days, so many families find it helpful to apply early. If you have long-term care insurance, most facilities will accept those policies. Veterans and their spouses may qualify for Aid and Attendance benefits, which can provide up to $2,431 per month toward care costs. Some families choose to pay privately using savings or home equity. A strategy many families use is to start with Medicare's 100-day benefit, then transition to Medicaid if eligible. If you're planning ahead, consulting with an elder law attorney 6-12 months before placement can help you understand options for protecting assets while qualifying for assistance programs.`,
        category: 'cost',
      },
      {
        question: 'How often should I visit after placement?',
        answer: `Your presence can make a tremendous difference in how your loved one adjusts to their new home. In those early days and weeks, frequent visits help them feel less alone during a significant transition. Your familiar face and voice provide comfort and reassurance when everything else feels new and unfamiliar. Many families find that being there regularly helps their loved one begin to trust the staff and feel more secure in their new environment. As you spend time with them, you'll naturally notice how they're settling in—whether they seem comfortable, whether their basic needs are being met, and whether they're forming connections with caregivers and other residents. Your ongoing presence isn't just about checking on care; it's about maintaining your relationship and letting them know they haven't been forgotten. You might share meals together, take walks if they're able, or simply sit and talk about their day. These visits help you understand their emotional state and whether they're finding moments of contentment in their new routine. When you're there, you can also notice the small things that matter to their comfort—whether they're warm enough, whether their favorite belongings are within reach, or whether they need help advocating for something they're hesitant to ask staff about. Trust your instincts about what your loved one needs from you, and don't hesitate to speak up if something concerns you about their wellbeing or safety.`,
        category: 'other',
      },
    ];
  }

  /**
   * Generate cost FAQ answer
   */
  private generateCostFAQ(data: EnhancedMetroData): string {
    const stateCosts: Record<string, number> = {
      'CA': 450, 'NY': 480, 'MA': 460, 'CT': 470, 'WA': 410,
      'OR': 380, 'MD': 370, 'PA': 350, 'IL': 330, 'TX': 280,
      'FL': 320, 'AZ': 300, 'NC': 290, 'GA': 300, 'VA': 340,
    };
    const baseRate = stateCosts[data.state] || 320;
    const avgScore = parseFloat(data.averageScore);
    const adjustedRate = Math.round(baseRate * (avgScore >= 70 ? 1.15 : avgScore >= 55 ? 1.05 : 0.95));

    return `${data.city} nursing home costs average $${adjustedRate}/day ($${Math.round(adjustedRate * 30).toLocaleString()}/month) but vary significantly by quality tier. Premium facilities (90+ score): $${Math.round(adjustedRate * 2)}/day. Excellent options (75-89): $${Math.round(adjustedRate * 1.5)}/day. Mid-tier (60-74): $${adjustedRate}/day. Budget options: $${Math.round(adjustedRate * 0.75)}/day. Costs include room, meals, nursing care, and activities. Extra costs: private room upgrade (+$50-150/day), cable TV, phone service, personal supplies. Semi-private rooms save $1,500-4,500/month vs. private rooms.`;
  }

  /**
   * Generate local resources
   */
  private generateLocalResources(data: EnhancedMetroData): MetroNarrative['localResources'] {
    // State-specific resource data
    const stateResources: Record<string, any> = {
      'OR': {
        ombudsman: { name: 'Oregon Long-Term Care Ombudsman', phone: '1-800-522-2602', website: 'https://www.oregon.gov/aging/pages/ltc-ombudsman.aspx' },
        aaa: { name: 'Oregon Department of Human Services - Aging and People with Disabilities', phone: '1-855-673-2372', website: 'https://www.oregon.gov/dhs/seniors-disabilities' },
        healthDept: { name: 'Oregon Health Authority', website: 'https://www.oregon.gov/oha' },
        elderLaw: { name: 'Oregon State Bar Elder Law Section', website: 'https://www.osbar.org' },
      },
      'MD': {
        ombudsman: { name: 'Maryland Long-Term Care Ombudsman', phone: '1-877-463-3464', website: 'https://aging.maryland.gov/Pages/ombudsman.aspx' },
        aaa: { name: 'Maryland Department of Aging', phone: '1-800-243-3425', website: 'https://aging.maryland.gov' },
        healthDept: { name: 'Maryland Department of Health', website: 'https://health.maryland.gov' },
        elderLaw: { name: 'Maryland State Bar Association Elder Law Section', website: 'https://www.msba.org' },
      },
      'CA': {
        ombudsman: { name: 'California Long-Term Care Ombudsman', phone: '1-800-231-4024', website: 'https://www.aging.ca.gov/Ombudsman' },
        aaa: { name: 'California Department of Aging', phone: '1-800-510-2020', website: 'https://www.aging.ca.gov' },
        healthDept: { name: 'California Department of Public Health', website: 'https://www.cdph.ca.gov' },
        elderLaw: { name: 'California State Bar Elder Law Section', website: 'https://www.calbar.ca.gov' },
      },
      'TX': {
        ombudsman: { name: 'Texas Long-Term Care Ombudsman', phone: '1-800-252-2412', website: 'https://www.dads.state.tx.us/services/ombudsman' },
        aaa: { name: 'Texas Health and Human Services', phone: '1-877-438-5658', website: 'https://www.hhs.texas.gov/services/aging' },
        healthDept: { name: 'Texas Department of State Health Services', website: 'https://www.dshs.texas.gov' },
        elderLaw: { name: 'State Bar of Texas Elder Law Section', website: 'https://www.texasbar.com' },
      },
      // Add more states as needed...
    };

    const resources = stateResources[data.state] || {
      ombudsman: { name: `${data.state} Long-Term Care Ombudsman`, phone: '1-800-XXX-XXXX', website: '#' },
      aaa: { name: `${data.state} Area Agency on Aging`, phone: '1-800-XXX-XXXX', website: '#' },
      healthDept: { name: `${data.state} Department of Health`, website: '#' },
      elderLaw: { name: `${data.state} State Bar Elder Law Section`, website: '#' },
    };

    return {
      stateOmbudsman: resources.ombudsman,
      areaAgencyOnAging: resources.aaa,
      stateHealthDept: resources.healthDept,
      elderLawReferral: resources.elderLaw,
    };
  }

  /**
   * Generate complete narrative for a metro
   */
  public generate(data: EnhancedMetroData): MetroNarrative {
    const tiers = this.getTierDistribution(data);
    const avgScore = parseFloat(data.averageScore);

    return {
      marketOverview: this.generateMarketOverview(data),
      costAnalysis: this.generateCostAnalysis(data, tiers),
      decisionFramework: this.generateDecisionFramework(data),
      faqs: this.generateFAQs(data, tiers),
      localResources: this.generateLocalResources(data),
      keyStats: {
        topTierCount: tiers.exceptional + tiers.excellent,
        medicaidFacilityCount: tiers.mixed + tiers.lower,
        averageWaitlistWeeks: avgScore >= 75 ? 8 : avgScore >= 60 ? 4 : 2,
        hasUrgentOptions: tiers.aboveAverage + tiers.mixed >= 2,
        qualityGap: data.table.length > 0 ? data.table[0].score - data.table[data.table.length - 1].score : 0,
      },
    };
  }
}
