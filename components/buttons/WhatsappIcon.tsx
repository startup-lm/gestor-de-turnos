import { FaWhatsapp } from 'react-icons/fa';
import { sendWhatsAppMessage } from '../../utils/whatsapp';
import { useBusinessContext } from '@/lib/context/BusinessContext';

export default function WhatsappIcon() {
  const { businessSettings } = useBusinessContext();
  
  return (
    <button onClick={() => sendWhatsAppMessage('Hola! Me gustaría hacer una consulta.', businessSettings?.phone)} className="icon-whatsapp" aria-label="Contactar por WhatsApp" >
      <FaWhatsapp size={24} color="white" />
    </button>
  );
}
