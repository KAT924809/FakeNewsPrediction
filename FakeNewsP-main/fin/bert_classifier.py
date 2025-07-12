import torch
import torch.nn as nn
from transformers import BertModel


class BERTClassifier(nn.Module):
    def __init__(self, bert_model):
        super().__init__()
        self.bert = bert_model
        self.bert.config.output_hidden_states = True
        
        hidden_size = 768  # Fixed for bert-base-uncased
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(3 * hidden_size, 2).float()
        self.loss_fn = nn.CrossEntropyLoss()

    def forward(self, input_ids, attention_mask, labels=None,**kwargs):
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            return_dict=True
        )
        
        # Last 3 transformer layers (indices 10,11,12)
        hidden_states = outputs.hidden_states[-3:]  
        # Validate layer selection
        assert len(hidden_states) == 3, f"Expected 3 layers, got {len(hidden_states)}"
        for hs in hidden_states:
            assert hs.size(-1) == 768, f"Invalid hidden size {hs.size()}"
        # CLS tokens with FP32 casting
        cls_embeddings = torch.cat([
            hidden_states[0][:, 0, :].float(),  # Layer 10
            hidden_states[1][:, 0, :].float(),  # Layer 11
            hidden_states[2][:, 0, :].float()   # Layer 12
        ], dim=1)
        
        pooled = self.dropout(cls_embeddings)
        logits = self.classifier(pooled)
        
        loss = self.loss_fn(logits, labels) if labels is not None else None
            
        return {'loss': loss, 'logits': logits, 'embeddings': cls_embeddings}
    




def load_model(model_path: str):
       bert_model = BertModel.from_pretrained("bert-base-uncased")
       model = BERTClassifier(bert_model)
       model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
       model.eval()
       return model