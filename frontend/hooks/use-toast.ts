import { useToastContext } from '../components/ui/toast';

export function useToast() {
  const { toast } = useToastContext();
  return { toast };
}
