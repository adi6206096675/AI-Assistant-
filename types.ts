
export type Source = {
  uri: string;
  title: string;
};

export type Message = {
  role: 'user' | 'model';
  text: string;
  image?: {
    data: string; // base64 or blob url
    mimeType: string;
  };
  sources?: Source[];
};