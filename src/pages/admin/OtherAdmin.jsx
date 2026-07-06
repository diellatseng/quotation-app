import BankAccountsAdmin from './BankAccountsAdmin'
import CompanyProfilesAdmin from './CompanyProfilesAdmin'

export default function OtherAdmin() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <CompanyProfilesAdmin />
      <BankAccountsAdmin />
    </div>
  )
}
