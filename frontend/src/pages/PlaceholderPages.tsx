

const PagePlaceholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-slate-500">This module is currently being developed. Check back soon!</p>
  </div>
);

export const DealsPage = () => <PagePlaceholder title="Deals" />;
export const ContactsPage = () => <PagePlaceholder title="Contacts" />;
export const CompaniesPage = () => <PagePlaceholder title="Companies" />;
export const TasksPage = () => <PagePlaceholder title="Tasks" />;
export const CommunicationsPage = () => <PagePlaceholder title="Communications" />;
export const ProductsPage = () => <PagePlaceholder title="Products" />;
export const ProposalsPage = () => <PagePlaceholder title="Proposals" />;
export const SettingsPage = () => <PagePlaceholder title="Settings" />;
