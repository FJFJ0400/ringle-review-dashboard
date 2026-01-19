class UploadHandler {
    constructor() {
        this.activeTab = 'manual'; // 'manual' or 'csv'
        this.pendingData = [];
        this.init();
    }

    init() {
        this.renderInterface();
        this.attachEventListeners();
    }

    renderInterface() {
        const container = document.getElementById('uploadApp');
        container.innerHTML = `
            <div class="tab-menu">
                <div class="tab-item ${this.activeTab === 'manual' ? 'active' : ''}" data-tab="manual">직접 입력</div>
                <div class="tab-item ${this.activeTab === 'csv' ? 'active' : ''}" data-tab="csv">CSV 업로드</div>
            </div>

            <div id="manualForm" style="display: ${this.activeTab === 'manual' ? 'block' : 'none'}">
                <div class="form-group">
                    <label class="form-label">소스명</label>
                    <input type="text" class="form-input" id="sourceInput" placeholder="예: 네이버 카페, 에브리타임">
                </div>
                <div class="form-group">
                    <label class="form-label">작성일</label>
                    <input type="date" class="form-input" id="dateInput">
                </div>
                <div class="form-group">
                    <label class="form-label">평점 (선택)</label>
                    <select class="form-select" id="ratingInput">
                        <option value="">선택 안함</option>
                        <option value="5">5점 (매우 만족)</option>
                        <option value="4">4점 (만족)</option>
                        <option value="3">3점 (보통)</option>
                        <option value="2">2점 (불만)</option>
                        <option value="1">1점 (매우 불만)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">리뷰 내용</label>
                    <textarea class="form-textarea" id="contentInput" placeholder="고객의 목소리를 입력하세요..."></textarea>
                </div>
                <button class="btn-primary" id="addBtn">목록에 추가</button>
            </div>

            <div id="csvForm" style="display: ${this.activeTab === 'csv' ? 'block' : 'none'}">
                <div class="drop-zone" id="dropZone">
                    <p>CSV 파일을 이곳에 드래그하거나 클릭하여 선택하세요</p>
                    <input type="file" id="fileInput" accept=".csv" style="display: none;">
                    <p style="font-size: 0.8rem; color: #999; margin-top: 10px;">
                        필수 컬럼: source, date, content<br>
                        선택 컬럼: rating, author
                    </p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // 탭 전환
        document.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.activeTab = e.target.dataset.tab;
                this.renderInterface();
                this.attachEventListeners(); // Re-attach after re-render
            });
        });

        // 직접 입력 추가
        const addBtn = document.getElementById('addBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleManualEntry());
        }

        // CSV 업로드
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#6366F1';
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = '#ddd';
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#ddd';
                const file = e.dataTransfer.files[0];
                if (file) this.handleCSV(file);
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) this.handleCSV(e.target.files[0]);
            });
        }
    }

    handleManualEntry() {
        const source = document.getElementById('sourceInput').value;
        const date = document.getElementById('dateInput').value;
        const content = document.getElementById('contentInput').value;
        const rating = document.getElementById('ratingInput').value;

        if (!source || !date || !content) {
            alert('소스명, 작성일, 내용은 필수입니다.');
            return;
        }

        this.pendingData.push({
            source,
            date,
            content,
            rating: rating ? parseInt(rating) : null,
            id: Date.now().toString()
        });

        this.renderPreview();
        
        // 입력 폼 초기화
        document.getElementById('contentInput').value = '';
    }

    handleCSV(file) {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const validRows = results.data.filter(row => row.source && row.content);
                if (validRows.length === 0) {
                    alert('유효한 데이터가 없습니다. CSV 형식을 확인해주세요.');
                    return;
                }
                
                const mappedData = validRows.map((row, index) => ({
                    source: row.source,
                    date: row.date || new Date().toISOString().split('T')[0],
                    content: row.content,
                    rating: row.rating ? parseInt(row.rating) : null,
                    id: `csv_${Date.now()}_${index}`
                }));

                this.pendingData = [...this.pendingData, ...mappedData];
                this.renderPreview();
            },
            error: (error) => {
                alert('CSV 파싱 오류: ' + error.message);
            }
        });
    }

    renderPreview() {
        const section = document.getElementById('previewSection');
        const content = document.getElementById('previewContent');
        
        if (this.pendingData.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        content.innerHTML = `
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>소스</th>
                        <th>날짜</th>
                        <th>내용</th>
                        <th>평점</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.pendingData.map((item, index) => `
                        <tr>
                            <td>${item.source}</td>
                            <td>${item.date}</td>
                            <td>${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}</td>
                            <td>${item.rating || '-'}</td>
                            <td><button onclick="uploadHandler.removeItem(${index})" style="color:red; border:none; background:none; cursor:pointer;">삭제</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; text-align: right;">
                <button class="btn-secondary" onclick="uploadHandler.clearAll()">초기화</button>
                <button class="btn-primary" onclick="uploadHandler.analyzeAndSave()">분석 및 저장</button>
            </div>
        `;
    }

    removeItem(index) {
        this.pendingData.splice(index, 1);
        this.renderPreview();
    }

    clearAll() {
        this.pendingData = [];
        this.renderPreview();
    }

    async analyzeAndSave() {
        const btn = document.querySelector('#previewContent .btn-primary');
        const originalText = btn.textContent;
        btn.textContent = '분석 중...';
        btn.disabled = true;

        // 실제로는 여기서 Claude API를 호출하거나 백엔드로 전송해야 함
        // 데모를 위해 간단한 로컬 분석(Mock) 수행
        const analyzedData = this.pendingData.map(item => ({
            ...item,
            year: item.date.split('-')[0],
            half: parseInt(item.date.split('-')[1]) <= 6 ? 'h1' : 'h2',
            sentiment: item.rating >= 4 ? 'positive' : (item.rating <= 2 ? 'negative' : 'neutral'),
            category: '수동 입력' // 실제 분석 시에는 API 결과 사용
        }));

        // 로컬 스토리지에 저장 (데모용)
        const existing = JSON.parse(localStorage.getItem('manual_reviews') || '[]');
        localStorage.setItem('manual_reviews', JSON.stringify([...existing, ...analyzedData]));

        alert(`${analyzedData.length}건의 데이터가 저장되었습니다.`);
        this.clearAll();
    }
}

const uploadHandler = new UploadHandler();