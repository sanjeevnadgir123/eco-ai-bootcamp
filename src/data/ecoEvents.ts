import { EcoEvent } from '../types';

import entrepreneurshipTalkImg from '../assets/events/entrepreneurship-expert-talk.jpg';
import entrepreneurshipSessionImg from '../assets/events/entrepreneurship-session.jpg';
import hodAchievementImg from '../assets/events/hod-international-achievement.jpg';
import eceFreshersImg from '../assets/events/ece-freshers-day.jpg';

export const ecoEvents: EcoEvent[] = [
  {
    id: 'expert-talk-entrepreneurship-innovation',
    title: 'Expert Talk on Entrepreneurship & Innovation',
    category: 'Faculty & Student Innovation',
    images: [
      entrepreneurshipTalkImg,
      entrepreneurshipSessionImg,
    ],
    description:
      'An expert session organized by the Department of Electronics and Communication Engineering at AGMRCET, Varur, bringing faculty members and students together to explore entrepreneurship and innovation.',
    tags: ['Entrepreneurship', 'Faculty & Students', 'ECE Department', 'Innovation Talk'],
    dateBadge: 'Flagship Seminar',
  },
  {
    id: 'international-recognition-hod',
    title: 'International Recognition for Our HOD',
    category: 'Faculty Excellence',
    images: [
      hodAchievementImg,
    ],
    description:
      'Congratulations to Dr. Sumana Achar, HOD of ECE, for representing AGMRCET, Varur, as Session Chair at an international conference in Krung Thep Maha Nakhon, Thailand.',
    tags: ['Global Recognition', 'HOD ECE', 'Session Chair', 'Thailand Conference'],
    dateBadge: 'Global Honour',
  },
  {
    id: 'celebrating-new-beginnings',
    title: 'Celebrating New Beginnings',
    category: 'Student Life & Celebrations',
    images: [
      eceFreshersImg,
    ],
    description:
      'A glimpse of the Freshers\' Day celebration organized by the Department of Electronics and Communication Engineering.',
    tags: ['Freshers Day', 'Student Life', 'ECO Community', 'Welcome Celebration'],
    dateBadge: 'Department Celebration',
  },
];
