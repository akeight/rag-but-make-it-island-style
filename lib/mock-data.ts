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
  
  
  