# Generated by Django 2.1 on 2018-10-01 17:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('elists', '0010_auto_20180930_0504'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='checkinsession',
            name='num_code',
        ),
        migrations.AddField(
            model_name='checkinsession',
            name='ballot_number',
            field=models.IntegerField(blank=True, db_index=True, null=True, unique=True, verbose_name='Номер бюлетеня'),
        ),
        migrations.AlterField(
            model_name='checkinsession',
            name='status',
            field=models.IntegerField(choices=[(1, 'Відкрита'), (2, 'В процесі'), (-1, 'Скасована'), (0, 'Завершена')], verbose_name='Статус'),
        ),
    ]