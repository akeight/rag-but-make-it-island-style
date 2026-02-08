// Mock data for RAG chatbot demonstration

export interface Document {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'PDF' | 'Text' | 'Email' | 'Deposition' | 'Court Filing';
    tags: string[];
    content: string;
    pageCount?: number;
  }
  
  export interface Citation {
    docId: string;
    docTitle: string;
    page?: number;
    section?: string;
    snippet: string;
  }
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    timestamp: Date;
  }
  
  export interface Chat {
    id: string;
    title: string;
    lastUpdated: Date;
    messages: Message[];
  }
  
  export const mockDocuments: Document[] = [
    {
      id: 'doc-001',
      title: 'Flight Logs (1997-2005)',
      description: 'Pilot logs documenting passenger lists and flight routes',
      date: '2005-11-15',
      type: 'PDF',
      tags: ['flight logs', 'travel records'],
      content: 'Detailed flight manifests showing dates, routes, and passenger information...',
      pageCount: 73
    },
    {
      id: 'doc-002',
      title: 'Deposition of Virginia Giuffre',
      description: 'Court deposition transcript',
      date: '2016-05-03',
      type: 'Deposition',
      tags: ['deposition', 'court filing', 'testimony'],
      content: 'Q: Can you describe your first meeting? A: I was introduced at Mar-a-Lago...',
      pageCount: 142
    },
    {
      id: 'doc-003',
      title: 'Black Book Contact List',
      description: 'Address book containing contact information',
      date: '2004-08-20',
      type: 'PDF',
      tags: ['contact list', 'addresses'],
      content: 'Comprehensive listing of names, addresses, and phone numbers...',
      pageCount: 92
    },
    {
      id: 'doc-004',
      title: 'Email Correspondence (Maxwell-Epstein)',
      description: 'Email exchange regarding property and scheduling',
      date: '2015-01-12',
      type: 'Email',
      tags: ['email', 'correspondence'],
      content: 'From: GM To: JE Subject: Schedule for next week...',
      pageCount: 1
    },
    {
      id: 'doc-005',
      title: 'Palm Beach Police Report',
      description: 'Initial police investigation report',
      date: '2005-03-14',
      type: 'Court Filing',
      tags: ['police report', 'investigation'],
      content: 'On March 14, 2005, Detective Recarey received information regarding...',
      pageCount: 34
    },
    {
      id: 'doc-006',
      title: 'Financial Records - Private Island',
      description: 'Transaction records for Little St. James property',
      date: '2008-06-22',
      type: 'PDF',
      tags: ['financial records', 'property'],
      content: 'Financial transactions related to construction and maintenance...',
      pageCount: 28
    },
    {
      id: 'doc-007',
      title: 'Victim Impact Statements',
      description: 'Collection of victim testimony',
      date: '2019-08-27',
      type: 'Court Filing',
      tags: ['testimony', 'court filing', 'victim statements'],
      content: 'Statement 1: I was 14 years old when I first met Jeffrey Epstein...',
      pageCount: 56
    },
    {
      id: 'doc-008',
      title: '2008 Plea Agreement',
      description: 'Non-prosecution agreement with federal prosecutors',
      date: '2008-09-24',
      type: 'Court Filing',
      tags: ['court filing', 'plea agreement', 'legal documents'],
      content: 'This agreement between the United States Attorney for the Southern District...',
      pageCount: 18
    }
  ];
  
  export const getSampleCitations = (query: string): Citation[] => {
    // Return relevant citations based on query keywords
    if (query.toLowerCase().includes('flight') || query.toLowerCase().includes('travel')) {
      return [
        {
          docId: 'doc-001',
          docTitle: 'Flight Logs (1997-2005)',
          page: 23,
          snippet: 'Flight manifest dated July 8, 2002, shows passenger list including multiple individuals traveling from Teterboro to Palm Beach.'
        },
        {
          docId: 'doc-001',
          docTitle: 'Flight Logs (1997-2005)',
          page: 45,
          snippet: 'Records indicate multiple international flights between 2001-2003, with stops in Paris, London, and the U.S. Virgin Islands.'
        }
      ];
    }
    
    if (query.toLowerCase().includes('island') || query.toLowerCase().includes('property')) {
      return [
        {
          docId: 'doc-006',
          docTitle: 'Financial Records - Private Island',
          page: 12,
          snippet: 'Construction invoices total $2.8M for renovations to the main residence and guest quarters during 2007-2008.'
        },
        {
          docId: 'doc-005',
          docTitle: 'Palm Beach Police Report',
          page: 8,
          snippet: 'Witnesses reported visits to both the Palm Beach residence and the private island property.'
        }
      ];
    }
  
    if (query.toLowerCase().includes('plea') || query.toLowerCase().includes('2008')) {
      return [
        {
          docId: 'doc-008',
          docTitle: '2008 Plea Agreement',
          page: 1,
          snippet: 'Agreement grants immunity from federal prosecution in exchange for guilty plea to state charges.'
        },
        {
          docId: 'doc-008',
          docTitle: '2008 Plea Agreement',
          page: 5,
          snippet: 'Terms include 18-month sentence with work release privileges and registration as sex offender.'
        }
      ];
    }
  
    // Default citations
    return [
      {
        docId: 'doc-002',
        docTitle: 'Deposition of Virginia Giuffre',
        page: 34,
        snippet: 'Testimony describes recruitment methods and the grooming process used to identify and approach young women.'
      },
      {
        docId: 'doc-007',
        docTitle: 'Victim Impact Statements',
        page: 12,
        snippet: 'Multiple victims describe similar patterns of manipulation and abuse over extended periods.'
      }
    ];
  };
  
  export const generateMockResponse = (query: string): { content: string; citations: Citation[] } => {
    const citations = getSampleCitations(query);
    
    let content = '';
    
    if (query.toLowerCase().includes('flight') || query.toLowerCase().includes('travel')) {
      content = 'According to the available flight logs, there are extensive records of private flights between 1997 and 2005. The logs document passenger manifests, departure and arrival locations, and dates. Notable patterns include frequent travel between Teterboro Airport in New Jersey, Palm Beach International Airport, and international destinations including Paris, London, and the U.S. Virgin Islands. The flight logs show multiple individuals traveling on these flights during this period.';
    } else if (query.toLowerCase().includes('island') || query.toLowerCase().includes('property')) {
      content = 'Documents reveal significant financial activity related to the private island property (Little St. James) in the U.S. Virgin Islands. Financial records show substantial investments in construction and renovation between 2007-2008, totaling approximately $2.8 million for improvements to residential structures. Multiple witness statements and police reports reference both the Palm Beach residence and the island property as relevant locations in the investigation.';
    } else if (query.toLowerCase().includes('plea') || query.toLowerCase().includes('2008')) {
      content = 'The 2008 plea agreement represents a controversial non-prosecution agreement with federal authorities. Under this agreement, Jeffrey Epstein pleaded guilty to state charges of solicitation of prostitution in exchange for federal immunity. The terms included an 18-month jail sentence with work release privileges and mandatory registration as a sex offender. This agreement has been widely criticized for its leniency and the protection it afforded to potential co-conspirators.';
    } else if (query.toLowerCase().includes('corpus') || query.toLowerCase().includes('contain')) {
      content = 'This corpus contains publicly released documents related to Jeffrey Epstein, including flight logs, court depositions, police reports, email correspondence, financial records, victim impact statements, and legal filings. The documents span from the late 1990s through 2019 and include materials from various legal proceedings, investigations, and court cases. All documents in this collection have been released through court orders, FOIA requests, or public legal proceedings.';
    } else {
      content = 'Based on the available documents in the corpus, there are multiple relevant sources that address this topic. The depositions and victim testimony provide first-hand accounts, while police reports and court filings offer investigative context. Financial records and correspondence provide documentation of activities and relationships. It\'s important to note that these documents represent publicly released materials from legal proceedings and should be evaluated within their proper legal and historical context.';
    }
    
    return { content, citations };
  };
  
  export const promptSuggestions = [
    "What documents are included in this corpus?",
    "Summarize the 2008 plea agreement",
    "What do the flight logs reveal about travel patterns?",
    "Show citations from victim testimony"
  ];