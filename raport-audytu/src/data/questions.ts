// src/data/questions.ts

export interface Question {
  id: string;
  text: string;
  answer?: boolean;
  note?: string;
  images: string[];
  disabled?: boolean;
   category_comment?: string;
  description?: string; // <-- dodajemy, bo była w initialQuestions
}

export interface NonCriticalEntry {
  id?: number;
  name: string;
  line: string;
  images: string[];
  note?: string;
}

export const categories = ["CMG.2", "CMG.3", "LWN", "CMG.5", "CMG.6"];

export const initialQuestions: Question[] = [
  { id: "1", text: "Stan piły", images: [], description: "(przykłady niezgodności: widoczne ścinki z dnia poprzedniego (brudne, inny produkt itp.), posadzka zakryta ścinkami, nagromadzone ścinki poza taśmociągiem itp.)" },
  { id: "2", text: "Zapylenie maszyn produkcja", images: [], description: "(przykłady niezgodności: tygodniowe zapylenie maszyny, nadmierny pył zasłaniający maszynę itp.)" },
  { id: "3", text: "Zapylenie maszyn UR", images: [], description: "(przykłady niezgodności: zapylone wentylatory, silniki, centralki hydrauliczne, pył zasłaniający kratki itp.)" },
  { id: "4", text: "Nagromadzenie logów odpadowych w maszynie", images: [], description: "" },
  { id: "5", text: "Strefy p.poż produkcja", images: [], description: "(przykłady niezgodności: niedostępne, zasłonięte gaśnice, hydranty, ROP oraz skrzynki elektryczne itp.)" },
  { id: "6", text: "Strefy p.poż UR", images: [], description: "(przykłady niezgodności: niezgodność z planem, zły stan sprzętów p.poż. itp.)" },
  { id: "7", text: "Prowizorki na maszynie", images: [], description: "" },
  { id: "8", text: "Zalegający brud", images: [], description: "(przykłady niezgodności: zaschnięty brud powyżej tygodnia = „uciapranie” itp.)" },
];
