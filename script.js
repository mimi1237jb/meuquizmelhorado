
const perguntas = [
    {
        pergunta: "Qual é o maior planeta do Sistema Solar?",
        alternativas: ["Terra", "Marte", "Júpiter", "Saturno"],
        correta: 2,
        explicacao: "Júpiter é o maior planeta do Sistema Solar."
    },
    {
        pergunta: "Qual é a capital do Brasil?",
        alternativas: ["São Paulo", "Brasília", "Rio de Janeiro", "Salvador"],
        correta: 1,
        explicacao: "Brasília é a capital do Brasil desde 1960."
    },
    {
        pergunta: "Quantos lados tem um hexágono?",
        alternativas: ["Cinco", "Sete", "Oito", "Seis"],
        correta: 3,
        explicacao: "Um hexágono tem seis lados."
    },
    {
        pergunta: "Qual é o maior oceano do planeta?",
        alternativas: [
            "Oceano Pacífico",
            "Oceano Atlântico",
            "Oceano Índico",
            "Oceano Ártico"
        ],
        correta: 0,
        explicacao: "O Oceano Pacífico é o maior dos oceanos."
    },
    {
        pergunta: "Qual destes animais é um mamífero?",
        alternativas: ["Tubarão", "Crocodilo", "Golfinho", "Pinguim"],
        correta: 2,
        explicacao: "O golfinho é um mamífero que respira por pulmões."
    },
    {
        pergunta: "Qual gás as plantas absorvem na fotossíntese?",
        alternativas: ["Oxigênio", "Gás carbônico", "Hidrogênio", "Hélio"],
        correta: 1,
        explicacao: "As plantas utilizam gás carbônico na fotossíntese."
    },
    {
        pergunta: "Em qual continente fica o Egito?",
        alternativas: ["Europa", "Ásia", "América", "África"],
        correta: 3,
        explicacao: "O Egito fica principalmente no nordeste da África."
    },
    {
        pergunta: "Qual é o resultado de 9 × 7?",
        alternativas: ["63", "56", "72", "67"],
        correta: 0,
        explicacao: "Nove vezes sete é igual a 63."
    },
    {
        pergunta: "Qual órgão bombeia o sangue pelo corpo?",
        alternativas: ["Pulmão", "Fígado", "Coração", "Estômago"],
        correta: 2,
        explicacao: "O coração bombeia o sangue pelo sistema circulatório."
    },
    {
        pergunta: "Qual é o idioma oficial do Brasil?",
        alternativas: ["Espanhol", "Português", "Inglês", "Francês"],
        correta: 1,
        explicacao: "O português é o idioma oficial do Brasil."
    }
];

const TEMPO_LIMITE = 15;

let indiceAtual = 0;
let pontos = 0;
let respondidas = 0;
let respondeu = false;
let tempoRestante = TEMPO_LIMITE;
let temporizador = null;
let somAtivo = true;
let audio = null;

const $ = id => document.getElementById(id);

const inicio = $("inicio");
const jogo = $("jogo");
const resultado = $("resultado");
const perguntaElemento = $("pergunta");
const alternativasElemento = $("alternativas");
const feedback = $("feedback");
const proxima = $("proxima");

// Sons gerados com a Web Audio API
function tocarSom(tipo) {
    if (!somAtivo) return;

    try {
        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audio) audio = new AudioContext();

        if (audio.state === "suspended") {
            audio.resume();
        }

        const notas = {
            clique: [{ f: 450, d: 0.07, t: 0 }],
            acerto: [
                { f: 523, d: 0.12, t: 0 },
                { f: 659, d: 0.12, t: 0.12 },
                { f: 784, d: 0.22, t: 0.24 }
            ],
            erro: [
                { f: 300, d: 0.16, t: 0 },
                { f: 220, d: 0.25, t: 0.15 }
            ],
            vitoria: [
                { f: 523, d: 0.15, t: 0 },
                { f: 659, d: 0.15, t: 0.15 },
                { f: 784, d: 0.15, t: 0.30 },
                { f: 1047, d: 0.4, t: 0.45 }
            ],
            tempo: [{ f: 700, d: 0.07, t: 0 }]
        };

        const agora = audio.currentTime;

        notas[tipo].forEach(nota => {
            const oscilador = audio.createOscillator();
            const volume = audio.createGain();

            oscilador.type = "sine";
            oscilador.frequency.value = nota.f;

            volume.gain.setValueAtTime(
                0.0001,
                agora + nota.t
            );

            volume.gain.exponentialRampToValueAtTime(
                0.13,
                agora + nota.t + 0.015
            );

            volume.gain.exponentialRampToValueAtTime(
                0.0001,
                agora + nota.t + nota.d
            );

            oscilador.connect(volume);
            volume.connect(audio.destination);

            oscilador.start(agora + nota.t);
            oscilador.stop(agora + nota.t + nota.d + 0.02);
        });
    } catch (erro) {
        console.warn("Não foi possível reproduzir o som.", erro);
    }
}

$("som").addEventListener("click", () => {
    somAtivo = !somAtivo;

    $("som").textContent = somAtivo
        ? "🔊 Som ligado"
        : "🔇 Som desligado";

    $("som").setAttribute(
        "aria-label",
        somAtivo ? "Desativar som" : "Ativar som"
    );

    if (somAtivo) tocarSom("clique");
});

$("comecar").addEventListener("click", () => {
    tocarSom("clique");
    iniciar();
});

$("reiniciar").addEventListener("click", () => {
    tocarSom("clique");
    iniciar();
});

proxima.addEventListener("click", avancar);

function pararTempo() {
    clearInterval(temporizador);
    temporizador = null;
}

function iniciar() {
    pararTempo();

    indiceAtual = 0;
    pontos = 0;
    respondidas = 0;
    respondeu = false;

    inicio.classList.add("oculto");
    resultado.classList.add("oculto");
    jogo.classList.remove("oculto");

    mostrarPergunta();
}

function mostrarPergunta() {
    pararTempo();
    respondeu = false;

    const atual = perguntas[indiceAtual];

    $("numero").textContent =
        `PERGUNTA ${indiceAtual + 1}/${perguntas.length}`;

    $("pontuacao").textContent = `⭐ ${pontos * 10} pontos`;

    $("barra").style.width =
        `${(indiceAtual / perguntas.length) * 100}%`;

    perguntaElemento.textContent = atual.pergunta;
    alternativasElemento.replaceChildren();

    feedback.textContent = "";
    proxima.disabled = true;

    proxima.textContent =
        indiceAtual === perguntas.length - 1
            ? "Ver resultado →"
            : "Próxima pergunta →";

    atual.alternativas.forEach((texto, indice) => {
        const botao = document.createElement("button");
        const letra = document.createElement("span");
        const conteudo = document.createElement("span");

        botao.className = "alternativa";
        letra.className = "letra";

        letra.textContent = String.fromCharCode(65 + indice);
        conteudo.textContent = texto;

        botao.append(letra, conteudo);

        botao.addEventListener("click", () => {
            verificarResposta(indice, botao);
        });

        alternativasElemento.appendChild(botao);
    });

    tempoRestante = TEMPO_LIMITE;
    atualizarTempo();

    temporizador = setInterval(() => {
        tempoRestante--;
        atualizarTempo();

        if (tempoRestante <= 5 && tempoRestante > 0) {
            tocarSom("tempo");
        }

        if (tempoRestante <= 0) {
            encerrarPorTempo();
        }
    }, 1000);
}

function atualizarTempo() {
    $("tempo").textContent = `${tempoRestante}s`;

    $("barraTempo").style.width =
        `${(tempoRestante / TEMPO_LIMITE) * 100}%`;

    $("barraTempo").style.background =
        tempoRestante <= 5 ? "#ff7185" : "#43d9a3";

    $("tempo").style.color =
        tempoRestante <= 5 ? "#ff7185" : "#43d9a3";
}

function verificarResposta(indiceEscolhido, botaoEscolhido) {
    if (respondeu) return;

    respondeu = true;
    pararTempo();
    respondidas++;

    const atual = perguntas[indiceAtual];
    const botoes = alternativasElemento.querySelectorAll("button");
    const acertou = indiceEscolhido === atual.correta;

    botoes.forEach((botao, indice) => {
        botao.disabled = true;

        if (indice === atual.correta) {
            botao.classList.add("correta");
        }
    });

    if (acertou) {
        pontos++;
        tocarSom("acerto");

        feedback.textContent = `✅ Muito bem! ${atual.explicacao}`;
        feedback.style.color = "#43d9a3";
    } else {
        botaoEscolhido.classList.add("errada");
        tocarSom("erro");

        feedback.textContent = `❌ ${atual.explicacao}`;
        feedback.style.color = "#ff7185";
    }

    $("pontuacao").textContent = `⭐ ${pontos * 10} pontos`;

    proxima.disabled = false;
}

function encerrarPorTempo() {
    if (respondeu) return;

    respondeu = true;
    pararTempo();
    respondidas++;

    const atual = perguntas[indiceAtual];
    const botoes = alternativasElemento.querySelectorAll("button");

    botoes.forEach((botao, indice) => {
        botao.disabled = true;

        if (indice === atual.correta) {
            botao.classList.add("correta");
        }
    });

    tocarSom("erro");

    feedback.textContent = `⏰ O tempo acabou! ${atual.explicacao}`;
    feedback.style.color = "#ff7185";

    proxima.disabled = false;
}

function avancar() {
    if (!respondeu) return;

    tocarSom("clique");

    indiceAtual++;

    if (indiceAtual < perguntas.length) {
        mostrarPergunta();
    } else {
        mostrarResultado();
    }
}

function mostrarResultado() {
    pararTempo();
    jogo.classList.add("oculto");
    resultado.classList.remove("oculto");

    const total = perguntas.length;
    const porcentagem = Math.round((pontos / total) * 100);

    $("barraFinal").style.width = `${porcentagem}%`;
    $("nota").textContent = `${pontos * 10}/100`;

    $("estatisticas").textContent =
        `Você acertou ${pontos} de ${total} perguntas ` +
        `e errou ou deixou de responder ${total - pontos}.`;

    let titulo;
    let mensagem;
    let emoji;

    if (pontos === 10) {
        titulo = "Incrível! Você é fera!";
        mensagem = "Você acertou todas as perguntas. Resultado perfeito!";
        emoji = "🏆";
        tocarSom("vitoria");
    } else if (pontos >= 7) {
        titulo = "Mandou muito bem!";
        mensagem = "Você demonstrou ótimos conhecimentos gerais!";
        emoji = "🎉";
        tocarSom("vitoria");
    } else if (pontos >= 4) {
        titulo = "Bom trabalho!";
        mensagem = "Você está no caminho certo. Que tal tentar de novo?";
        emoji = "👏";
        tocarSom("acerto");
    } else {
        titulo = "Continue tentando!";
        mensagem = "Cada tentativa é uma oportunidade de aprender.";
        emoji = "💪";
        tocarSom("erro");
    }

    $("tituloResultado").textContent = titulo;
    $("mensagem").textContent = mensagem;
    $("emojiResultado").textContent = emoji;
}
