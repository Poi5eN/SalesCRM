import { useUIStore } from '@/store/ui.store.ts';

export const useConfirm = () => {
  const confirm = useUIStore((state) => state.confirm);

  return {
    confirm: (message: string, title = 'Are you sure?', variant: 'danger' | 'primary' = 'danger') => 
      confirm({ title, message, variant }),
  };
};
