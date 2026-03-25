export default function Confirmacao() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
          <span className="text-green-500 text-2xl">✓</span>
        </div>
        <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Cadastro realizado!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Obrigado por se cadastrar. Em breve entraremos em contato.
        </p>
      </div>
    </div>
  )
}
