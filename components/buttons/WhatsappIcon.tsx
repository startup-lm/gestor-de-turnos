import { FaWhatsapp } from 'react-icons/fa';
import { sendWhatsAppMessage } from '../../utils/whatsapp';

export default function WhatsappIcon() {
  return (
    <button onClick={() => sendWhatsAppMessage()} className="icon-whatsapp" aria-label="Contactar por WhatsApp" >
      <FaWhatsapp size={24} color="white" />
    </button>
  );
}
