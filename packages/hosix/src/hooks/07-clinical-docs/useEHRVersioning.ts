// Clinical docs stubs
import { useState } from 'react';

export const useEHRVersioning = () => {
  const [versions, setVersions] = useState([]);
  return { versions };
};

export const useDocumentEncryption = () => {
  const [encrypted, setEncrypted] = useState(false);
  return { encrypted };
};
