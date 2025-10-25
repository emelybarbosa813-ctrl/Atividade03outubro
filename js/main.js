// ===============================
// SPA + Templates + Validação + Armazenamento Local + Modal + Newsletter
// ===============================

// ---- Sistema de Rotas (SPA) ----
const Router = {
  routes: {},
  rootEl: null,
  init(rootSelector = '#app') {
    this.rootEl = document.querySelector(rootSelector);
    window.addEventListener('popstate', () => this.load(location.pathname));
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-link]');
      if (a) {
        e.preventDefault();
        this.navigate(a.getAttribute('href'));
      }
    });
  },
  add(path, handler) {
    this.routes[path] = handler;
  },
  navigate(path) {
    history.pushState({}, '', path);
    this.load(path);
  },
  load(path) {
    const handler = this.routes[path] || this.routes['/404'] || this.routes['/'];
    if (typeof handler === 'function') {
      handler(this.rootEl);
    } else {
      this.rootEl.innerHTML = '<p>Rota inválida</p>';
    }
  }
};

// ---- Armazenamento Local (cadastros/doações) ----
const Storage = {
  prefix: 'ong_literatura_',
  save(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  },
  load(key, fallback = null) {
    const data = localStorage.getItem(this.prefix + key);
    return data ? JSON.parse(data) : fallback;
  },
  pushToArray(key, item) {
    const arr = this.load(key, []);
    arr.push(item);
    this.save(key, arr);
  }
};

// ---- Sistema de Validação ----
const Validation = {
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
    telefone: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
    cep: /^\d{5}-?\d{3}$/
  },
  showError(input, msg) {
    input.classList.add('error-field');
    let err = input.nextElementSibling;
    if (!err || !err.classList.contains('field-error')) {
      err = document.createElement('div');
      err.className = 'field-error';
      input.parentNode.insertBefore(err, input.nextSibling);
    }
    err.textContent = msg;
  },
  clearError(input) {
    input.classList.remove('error-field');
    const err = input.nextElementSibling;
    if (err && err.classList.contains('field-error')) err.textContent = '';
  },
  validateField(input) {
    const name = input.name || input.id;
    const val = input.value.trim();
    if (input.required && !val) {
      this.showError(input, 'Campo obrigatório.');
      return false;
    }
    if (val) {
      if (name.includes('email') && !this.patterns.email.test(val))
        return this.showError(input, 'Email inválido.'), false;
      if (name.includes('cpf') && !this.patterns.cpf.test(val))
        return this.showError(input, 'CPF inválido.'), false;
      if (name.includes('telefone') && !this.patterns.telefone.test(val))
        return this.showError(input, 'Telefone inválido.'), false;
      if (name.includes('cep') && !this.patterns.cep.test(val))
        return this.showError(input, 'CEP inválido.'), false;
    }
    if (input.type === 'date' && val) {
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      if (age < 13) return this.showError(input, 'Idade mínima 13 anos.'), false;
    }
    this.clearError(input);
    return true;
  },
  validateForm(form) {
    let ok = true;
    form.querySelectorAll('input, select, textarea').forEach(i => {
      if (!this.validateField(i)) ok = false;
    });
    return ok;
  }
};

// ---- Sistema de Toasts ----
function toast(msg, type = 'info') {
  let box = document.getElementById('toast-container');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-container';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.classList.add('show'), 50);
  setTimeout(() => el.classList.remove('show'), 3500);
  setTimeout(() => box.removeChild(el), 4000);
}

// ---- Templates SPA ----
const Templates = {
  home(root) {
    root.innerHTML = `
      <section id="apresentacao">
        <h2>Transformando o Brasil, uma Leitura por Vez</h2>
        <p>A ONG Portal da Literatura cria pontes entre pessoas e conhecimento.</p>
        <div class="card">
          <h3>Últimas Ações</h3>
          <p>Rodas de leitura, biblioteca itinerante e campanhas de doação.</p>
          <a href="/projetos" data-link class="button">Ver Projetos</a>
        </div>
      </section>`;
  },

  projetos(root) {
    root.innerHTML = `
      <section id="projetos">
        <h2>Projetos em Destaque</h2>
        <div class="card">
          <h3>📚 Roda de Leitura Comunitária</h3>
          <p>Leitura compartilhada em praças e escolas públicas.</p>
        </div>
        <div class="card">
          <h3>🚐 Biblioteca Itinerante</h3>
          <p>Leva livros e oficinas a comunidades rurais.</p>
        </div>
        <section id="doacao">
          <h2>💖 Apoie Nossa Causa</h2>
          <p>Cada contribuição ajuda a espalhar mais leitura e esperança.</p>
          <a href="#" id="btnDoar" class="button">Quero Doar</a>
        </section>
      </section>`;

    document.getElementById('btnDoar').addEventListener('click', e => {
      e.preventDefault();
      Templates.formDoacao(root);
    });
  },

  formDoacao(root) {
    const sec = root.querySelector('#doacao');
    sec.innerHTML = `
      <h2>💝 Fazer Doação</h2>
      <form id="form-doacao" class="card">
        <label>Tipo</label>
        <select name="tipo" required>
          <option value="">Selecione</option>
          <option value="financeira">Financeira</option>
          <option value="livros">Livros</option>
        </select>
        <label>Valor (se financeira)</label>
        <input name="valor" type="number" min="1" step="0.01">
        <label>Mensagem</label>
        <textarea name="mensagem" rows="3"></textarea>
        <button class="button" type="submit">Enviar Doação</button>
      </form>`;

    const form = document.getElementById('form-doacao');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (!Validation.validateForm(form)) return toast('Preencha corretamente.', 'error');
      const dados = Object.fromEntries(new FormData(form));
      Storage.pushToArray('doacoes', dados);
      toast('Doação registrada (simulação). Obrigado!', 'success');
      form.reset();
    });
  },

  cadastro(root) {
    root.innerHTML = `
      <section id="cadastro">
        <h2>Seja Voluntário</h2>
        <form id="form-cadastro" class="card">
          <label>Nome Completo</label>
          <input name="nome" required>

          <label>Email</label>
          <input name="email" required>

          <label>CPF</label>
          <input name="cpf" required placeholder="000.000.000-00">

          <label>Telefone</label>
          <input name="telefone" required placeholder="(99) 99999-9999">

          <label>Data de Nascimento</label>
          <input type="date" name="data_nasc" required>

          <label>CEP</label>
          <input name="cep" required placeholder="00000-000">

          <label>Cidade</label>
          <input name="cidade" required>

          <label>Estado</label>
          <select name="estado" required>
            <option value="">Selecione</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            <option value="BA">Bahia</option>
            <option value="PR">Paraná</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="PE">Pernambuco</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="OUTRO">Outro</option>
          </select>

          <label>Mensagem</label>
          <textarea name="mensagem" rows="3"></textarea>

          <h3>📖 Assine Nossa Newsletter de Leitores</h3>
          <label>
            <input type="checkbox" name="newsletter"> Deseja receber novidades?
          </label>

          <button type="submit" class="button">Enviar Cadastro</button>
        </form>
      </section>
    `;

    const form = document.getElementById('form-cadastro');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (!Validation.validateForm(form)) {
        toast('Preencha corretamente os campos obrigatórios.', 'error');
        return;
      }
      const dados = Object.fromEntries(new FormData(form));
      Storage.pushToArray('voluntarios', dados);
      if (dados.newsletter) Storage.pushToArray('newsletter', { email: dados.email });
      toast('Cadastro realizado com sucesso!', 'success');
      form.reset();
    });
  }
};

// ---- Inicialização SPA ----
document.addEventListener('DOMContentLoaded', () => {
  Router.init();

  // Rotas
  Router.add('/', Templates.home);
  Router.add('/projetos', Templates.projetos);
  Router.add('/cadastro', Templates.cadastro);
  Router.add('/404', (root) => root.innerHTML = '<h2>Página não encontrada</h2>');

  // Carrega a rota atual
  Router.load(location.pathname);
});
